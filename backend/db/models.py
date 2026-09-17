from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ScanCreate(BaseModel):
    video_name: str
    feature_method: str = 'cnn'
    clustering_method: str = 'kmeans'
    n_clusters: int = 5

class ScanResponse(BaseModel):
    id: str
    created_at: datetime
    video_name: str
    video_duration: Optional[float]
    total_frames: Optional[int]
    sampled_frames: Optional[int]
    feature_method: str
    clustering_method: str
    num_clusters: Optional[int]
    status: str
    video_url: Optional[str]
    thumbnail_url: Optional[str]

class ScanResultResponse(BaseModel):
    id: str
    scan_id: str
    silhouette_score: Optional[float]
    calinski_harabasz_score: Optional[float]
    davies_bouldin_score: Optional[float]
    cluster_labels: Optional[List[int]]
    cluster_sizes: Optional[Dict[str, int]]
    tsne_coords: Optional[List[List[float]]]
    pca_coords: Optional[List[List[float]]]
    timeline_data: Optional[List[Dict[str, Any]]]
    representative_frames: Optional[Dict[str, str]]

class ScanListResponse(BaseModel):
    items: List[ScanResponse]
    total: int
    limit: int
    offset: int

class ProcessRequest(BaseModel):
    feature_method: str = 'cnn'
    clustering_method: str = 'kmeans'
    n_clusters: int = 5

class StatusResponse(BaseModel):
    status: str
