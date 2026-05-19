from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "AI Transcriber"
    DATABASE_URL: str = "sqlite+aiosqlite:///./transcriber.db"
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 500 * 1024 * 1024
    ALLOWED_EXTENSIONS: list[str] = ["mp3", "wav", "m4a", "ogg", "aac", "flac"]
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "whisper-1"
    WHISPER_MODEL_SIZE: str = "base"
    STORAGE_RETENTION_DAYS: int = 30
    MAX_UPLOADS_PER_USER: int = 100
    RATE_LIMIT_PER_MINUTE: int = 10
    DEFAULT_LANGUAGE: str = "auto"
    SUPPORTED_LANGUAGES: list[str] = ["auto", "ru", "en", "de", "fr", "es", "it", "pt", "zh", "ja"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
