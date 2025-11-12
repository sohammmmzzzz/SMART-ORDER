from supabase import create_client, Client
from config import get_settings
from typing import Optional

settings = get_settings()


class Database:
    """Database connection manager for Supabase"""

    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client"""
        if cls._client is None:
            cls._client = create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
        return cls._client

    @classmethod
    def get_anon_client(cls) -> Client:
        """Get Supabase client with anon key (for public operations)"""
        return create_client(
            settings.supabase_url,
            settings.supabase_anon_key
        )


def get_db() -> Client:
    """Dependency for getting database client"""
    return Database.get_client()
