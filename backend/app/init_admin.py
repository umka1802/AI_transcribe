"""Utility to create admin user."""
import asyncio
import sys
from .database import async_session, init_db
from .models.user import User
from .utils.auth import get_password_hash
from sqlalchemy import select


async def create_admin(email: str, username: str, password: str):
    await init_db()
    async with async_session() as session:
        existing = await session.execute(
            select(User).where((User.username == username) | (User.email == email))
        )
        if existing.scalar_one_or_none():
            print(f"User {username} already exists")
            return

        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_admin=True,
        )
        session.add(user)
        await session.commit()
        print(f"Admin user '{username}' created successfully")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python -m app.init_admin <email> <username> <password>")
        sys.exit(1)
    asyncio.run(create_admin(sys.argv[1], sys.argv[2], sys.argv[3]))
