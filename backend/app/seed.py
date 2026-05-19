import asyncio
from .database import async_session, init_db
from .models.user import User
from .models.system_setting import SystemSetting
from .utils.auth import get_password_hash
from sqlalchemy import select


async def seed():
    await init_db()
    async with async_session() as session:
        admin_exists = await session.execute(select(User).where(User.username == "admin"))
        if not admin_exists.scalar_one_or_none():
            admin = User(
                email="admin@transcriber.local",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_admin=True,
            )
            session.add(admin)

        default_settings = [
            ("max_file_size", "524288000", "Maximum file size in bytes (500 MB)"),
            ("storage_retention_days", "30", "Number of days to retain files"),
            ("max_uploads_per_user", "100", "Maximum uploads per user"),
            ("rate_limit_per_minute", "10", "API rate limit per minute"),
            ("default_language", "auto", "Default transcription language"),
            ("whisper_model_size", "base", "Local Whisper model size (tiny/base/small/medium/large)"),
        ]

        for key, value, desc in default_settings:
            existing = await session.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            if not existing.scalar_one_or_none():
                session.add(SystemSetting(key=key, value=value, description=desc))

        await session.commit()
        print("Database seeded successfully")
        print("Admin user: admin / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
