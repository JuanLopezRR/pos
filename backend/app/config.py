from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "LopezTech POS"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pos_db"
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "tauri://localhost"]

    class Config:
        env_file = ".env"


settings = Settings()
