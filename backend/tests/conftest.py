import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.utils.auth import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_transcriber.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@pytest.fixture(scope="function")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


async def _create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        admin = await session.execute(select(User).where(User.username == "admin"))
        if not admin.scalar_one_or_none():
            session.add(User(
                email="admin@example.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_admin=True,
            ))
        user = await session.execute(select(User).where(User.username == "testuser"))
        if not user.scalar_one_or_none():
            session.add(User(
                email="user@example.com",
                username="testuser",
                hashed_password=get_password_hash("test123"),
                is_active=True,
                is_admin=False,
            ))
        await session.commit()


async def _drop_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await _create_tables()
    yield
    await _drop_tables()


@pytest_asyncio.fixture
async def client():
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def user_token():
    return create_access_token(data={"sub": "2", "is_admin": False})


@pytest.fixture
def admin_token():
    return create_access_token(data={"sub": "1", "is_admin": True})
