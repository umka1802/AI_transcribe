"""Utility to initialize default settings."""
import asyncio
from .database import async_session, init_db
from .models.system_setting import SystemSetting
from sqlalchemy import select


DEFAULT_SETTINGS = [
    ("max_file_size", "524288000", "Maximum file size in bytes (500 MB)"),
    ("storage_retention_days", "30", "Number of days to retain files and results"),
    ("max_uploads_per_user", "100", "Maximum number of uploads per user"),
    ("rate_limit_per_minute", "10", "API requests per minute limit"),
    ("default_language", "auto", "Default language for transcription"),
    ("whisper_model_size", "base", "Whisper model size (tiny/base/small/medium/large)"),
]


async def init_settings():
    await init_db()
    async with async_session() as session:
        for key, value, desc in DEFAULT_SETTINGS:
            existing = await session.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            if not existing.scalar_one_or_none():
                session.add(SystemSetting(key=key, value=value, description=desc))
        await session.commit()
        print(f"Initialized {len(DEFAULT_SETTINGS)} default settings")


if __name__ == "__main__":
    asyncio.run(init_settings())
