from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from .config import settings


engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        from .models import User, TranscriptionTask, SystemLog, SystemSetting
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import select, text as sa_text
    async with async_session() as session:
        admin = await session.execute(select(User).where(User.username == "admin"))
        if not admin.scalar_one_or_none():
            from .utils.auth import get_password_hash
            session.add(User(
                email="admin@transcriber.local",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_admin=True,
            ))

        default_settings = [
            ("max_file_size", "524288000", "Maximum file size in bytes (500 MB)"),
            ("storage_retention_days", "30", "Number of days to retain files and results"),
            ("max_uploads_per_user", "100", "Maximum number of uploads per user"),
            ("rate_limit_per_minute", "10", "API requests per minute limit"),
            ("default_language", "auto", "Default language for transcription"),
            ("whisper_model_size", "base", "Whisper model size (tiny/base/small/medium/large)"),
        ]
        for key, value, desc in default_settings:
            existing = await session.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            if not existing.scalar_one_or_none():
                session.add(SystemSetting(key=key, value=value, description=desc))
        await session.commit()
