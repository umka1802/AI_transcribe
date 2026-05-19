from sqlalchemy.ext.asyncio import AsyncSession
from ..models.system_log import SystemLog


async def log_action(
    db: AsyncSession,
    level: str,
    action: str,
    user_id: int = None,
    details: str = None,
    ip_address: str = None,
):
    log_entry = SystemLog(
        level=level,
        action=action,
        user_id=user_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log_entry)
    await db.commit()
