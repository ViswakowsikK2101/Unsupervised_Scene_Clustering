from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    ALLOWED_ORIGINS: List[str] = ['http://localhost:3000', 'https://*.vercel.app']
    MAX_VIDEO_SIZE_MB: int = 500
    FRAME_SAMPLE_RATE: int = 1
    DEFAULT_FEATURE_METHOD: str = 'cnn'
    DEFAULT_CLUSTERING_METHOD: str = 'kmeans'
    DEFAULT_N_CLUSTERS: int = 5
    PCA_COMPONENTS: int = 50
    UPLOAD_DIR: str = 'temp_uploads'
    MODEL_DIR: str = 'models'

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

@lru_cache()
def get_settings():
    return Settings()
