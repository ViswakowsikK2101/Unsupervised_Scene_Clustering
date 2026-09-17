import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from supabase import Client
from api.dependencies import get_db_client, get_app_settings
from db.models import ProcessRequest, StatusResponse
import uuid
import logging
import json

# Assuming pipeline is in ml.pipeline
try:
    from ml.pipeline import SceneClusteringPipeline
except ImportError:
    # Dummy pipeline for now if not implemented
    class SceneClusteringPipeline:
        def __init__(self, *args, **kwargs):
            pass
        def run(self, *args, **kwargs):
            return {"scan_info": {}, "metrics": {}, "cluster_labels": [], "cluster_sizes": {}, "tsne_coords": [], "pca_coords": [], "timeline_data": [], "representative_frames": {}}

router = APIRouter(prefix="/api", tags=["video"])
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    db: Client = Depends(get_db_client),
    settings = Depends(get_app_settings)
):
    temp_id = str(uuid.uuid4())
    filename = f"{temp_id}_{file.filename}"
    upload_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        with open(upload_path, 'rb') as f:
            res = db.storage.from_("video-uploads").upload(filename, f)
        
        video_url = db.storage.from_("video-uploads").get_public_url(filename)
        
        scan_data = {
            "video_name": file.filename,
            "status": "uploaded",
            "video_url": video_url
        }
        scan_res = db.table("scans").insert(scan_data).execute()
        
        return {"scan_id": scan_res.data[0]["id"]}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(upload_path):
            os.remove(upload_path)

def process_video_task(scan_id: str, request: ProcessRequest, db: Client, settings):
    try:
        db.table("scans").update({"status": "processing", "feature_method": request.feature_method, "clustering_method": request.clustering_method, "num_clusters": request.n_clusters}).eq("id", scan_id).execute()
        
        scan = db.table("scans").select("*").eq("id", scan_id).execute()
        if not scan.data:
            raise Exception("Scan not found")
        
        video_url = scan.data[0]["video_url"]
        filename = video_url.split("/")[-1]
        
        temp_video_path = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        res = db.storage.from_("video-uploads").download(filename)
        with open(temp_video_path, "wb") as f:
            f.write(res)
            
        pipeline = SceneClusteringPipeline(
            feature_method=request.feature_method,
            clustering_method=request.clustering_method,
            n_clusters=request.n_clusters,
            pca_components=settings.PCA_COMPONENTS
        )
        
        results = pipeline.run(temp_video_path, settings.UPLOAD_DIR)
        
        # Upload frames
        frames = results.get("representative_frames", {})
        uploaded_frames = {}
        for cluster, frame_path in frames.items():
            if os.path.exists(frame_path):
                frame_filename = f"{scan_id}_{cluster}.jpg"
                with open(frame_path, 'rb') as f:
                    db.storage.from_("frame-thumbnails").upload(frame_filename, f)
                uploaded_frames[cluster] = db.storage.from_("frame-thumbnails").get_public_url(frame_filename)
        
        metrics = results.get("metrics", {})
        scan_results_data = {
            "scan_id": scan_id,
            "silhouette_score": metrics.get("silhouette"),
            "calinski_harabasz_score": metrics.get("calinski_harabasz"),
            "davies_bouldin_score": metrics.get("davies_bouldin"),
            "cluster_labels": results.get("cluster_labels"),
            "cluster_sizes": results.get("cluster_sizes"),
            "tsne_coords": results.get("tsne_coords"),
            "pca_coords": results.get("pca_coords"),
            "timeline_data": results.get("timeline_data"),
            "representative_frames": uploaded_frames
        }
        
        db.table("scan_results").insert(scan_results_data).execute()
        db.table("scans").update({"status": "completed"}).eq("id", scan_id).execute()
        
    except Exception as e:
        logger.error(f"Processing failed for scan {scan_id}: {e}")
        db.table("scans").update({"status": "failed"}).eq("id", scan_id).execute()
    finally:
        if 'temp_video_path' in locals() and os.path.exists(temp_video_path):
            os.remove(temp_video_path)

@router.post("/process/{scan_id}")
async def process_video(
    scan_id: str,
    request: ProcessRequest,
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_db_client),
    settings = Depends(get_app_settings)
):
    background_tasks.add_task(process_video_task, scan_id, request, db, settings)
    return {"message": "Processing started", "scan_id": scan_id}

@router.get("/status/{scan_id}", response_model=StatusResponse)
async def get_status(scan_id: str, db: Client = Depends(get_db_client)):
    res = db.table("scans").select("status").eq("id", scan_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"status": res.data[0]["status"]}

@router.get("/results/{scan_id}")
async def get_results(scan_id: str, db: Client = Depends(get_db_client)):
    res = db.table("scan_results").select("*").eq("scan_id", scan_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Results not found")
    return res.data[0]

@router.get("/frames/{scan_id}")
async def get_frames(scan_id: str, db: Client = Depends(get_db_client)):
    res = db.table("scan_results").select("representative_frames").eq("scan_id", scan_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Results not found")
    return res.data[0].get("representative_frames", {})
