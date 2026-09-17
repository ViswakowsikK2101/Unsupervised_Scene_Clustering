from fastapi import Depends
from config import Settings, get_settings
from db.supabase_client import get_supabase_client
from supabase import Client

def get_db_client() -> Client:
    return get_supabase_client()

def get_app_settings() -> Settings:
    return get_settings()
