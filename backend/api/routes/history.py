from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from api.dependencies import get_db_client
from db.models import ScanListResponse, ScanResponse

router = APIRouter(prefix="/api", tags=["history"])

@router.get("/history", response_model=ScanListResponse)
async def list_scans(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_db_client)
):
    count_res = db.table("scans").select("*", count="exact").execute()
    total = count_res.count if count_res.count else 0
    
    res = db.table("scans").select("*").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    return {
        "items": res.data,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.get("/history/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, db: Client = Depends(get_db_client)):
    res = db.table("scans").select("*").eq("id", scan_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Scan not found")
    return res.data[0]

@router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, db: Client = Depends(get_db_client)):
    # Get scan to find files
    scan_res = db.table("scans").select("video_url").eq("id", scan_id).execute()
    if not scan_res.data:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    video_url = scan_res.data[0].get("video_url")
    if video_url:
        filename = video_url.split("/")[-1]
        try:
            db.storage.from_("video-uploads").remove([filename])
        except Exception:
            pass # ignore storage delete errors
            
    # Delete from DB
    db.table("scans").delete().eq("id", scan_id).execute()
    
    return {"message": "Scan deleted"}
