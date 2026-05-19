from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ..database import get_db
from ..models.user import User
from ..models.task import TranscriptionTask
from ..models.system_log import SystemLog
from ..models.system_setting import SystemSetting
from ..schemas.user import UserResponse, UserUpdate
from ..schemas.task import TranscriptionTaskResponse
from ..schemas.setting import SettingResponse, SettingUpdate
from ..schemas.log import LogResponse
from ..utils.deps import get_admin_user
from ..utils.logging import log_action

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(size)
    )
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.email is not None:
        user.email = user_data.email
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.is_admin is not None:
        user.is_admin = user_data.is_admin

    await db.commit()
    await db.refresh(user)

    await log_action(db, "INFO", "user_updated", admin.id,
                     f"User {user_id} updated by admin", request.client.host)

    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tasks_result = await db.execute(
        select(TranscriptionTask).where(TranscriptionTask.user_id == user_id)
    )
    for task in tasks_result.scalars().all():
        await db.delete(task)

    await db.delete(user)
    await db.commit()

    await log_action(db, "INFO", "user_deleted", admin.id,
                     f"User {user_id} deleted by admin", request.client.host)

    return {"message": "User deleted"}


@router.get("/tasks", response_model=list[TranscriptionTaskResponse])
async def list_all_tasks(
    status: str = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    query = select(TranscriptionTask).order_by(desc(TranscriptionTask.created_at))
    if status:
        query = query.where(TranscriptionTask.status == status)
    query = query.offset(offset).limit(size)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/tasks/stats")
async def get_task_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total = await db.execute(select(func.count(TranscriptionTask.id)))
    by_status = await db.execute(
        select(TranscriptionTask.status, func.count(TranscriptionTask.id))
        .group_by(TranscriptionTask.status)
    )
    stats = {row[0]: row[1] for row in by_status.all()}
    return {
        "total": total.scalar(),
        "by_status": stats,
    }


@router.post("/tasks/{task_id}/retry")
async def retry_task(
    task_id: int,
    request: Request,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TranscriptionTask).where(TranscriptionTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "uploaded"
    task.error_message = None
    await db.commit()

    await log_action(db, "INFO", "task_retried", admin.id,
                     f"Task {task_id} retried by admin", request.client.host)

    return {"message": "Task queued for retry", "task_id": task.id}


@router.delete("/tasks/{task_id}")
async def delete_any_task(
    task_id: int,
    request: Request,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TranscriptionTask).where(TranscriptionTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    from ..services.audio_service import get_file_path, delete_file
    file_path = get_file_path(task.user_id, task.filename)
    delete_file(file_path)

    await db.delete(task)
    await db.commit()

    await log_action(db, "INFO", "admin_task_deleted", admin.id,
                     f"Task {task_id} deleted by admin", request.client.host)

    return {"message": "Task deleted"}


@router.get("/logs", response_model=list[LogResponse])
async def get_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    level: str = Query(None),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    query = select(SystemLog).order_by(desc(SystemLog.created_at))
    if level:
        query = query.where(SystemLog.level == level)
    query = query.offset(offset).limit(size)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/settings", response_model=list[SettingResponse])
async def get_settings(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SystemSetting))
    return result.scalars().all()


@router.put("/settings/{setting_id}", response_model=SettingResponse)
async def update_setting(
    setting_id: int,
    setting_data: SettingUpdate,
    request: Request,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SystemSetting).where(SystemSetting.id == setting_id))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    setting.value = setting_data.value
    await db.commit()
    await db.refresh(setting)

    await log_action(db, "INFO", "setting_updated", admin.id,
                     f"Setting {setting.key} updated", request.client.host)

    return setting


@router.get("/dashboard")
async def get_dashboard(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_users = await db.execute(select(func.count(User.id)))
    total_tasks = await db.execute(select(func.count(TranscriptionTask.id)))
    completed_tasks = await db.execute(
        select(func.count(TranscriptionTask.id)).where(TranscriptionTask.status == "completed")
    )
    failed_tasks = await db.execute(
        select(func.count(TranscriptionTask.id)).where(TranscriptionTask.status == "error")
    )
    recent_tasks = await db.execute(
        select(TranscriptionTask).order_by(desc(TranscriptionTask.created_at)).limit(5)
    )
    recent_logs = await db.execute(
        select(SystemLog).order_by(desc(SystemLog.created_at)).limit(5)
    )

    return {
        "total_users": total_users.scalar(),
        "total_tasks": total_tasks.scalar(),
        "completed_tasks": completed_tasks.scalar(),
        "failed_tasks": failed_tasks.scalar(),
        "recent_tasks": [{
            "id": t.id, "filename": t.original_filename,
            "status": t.status, "created_at": t.created_at.isoformat()
        } for t in recent_tasks.scalars().all()],
        "recent_logs": [{
            "id": l.id, "level": l.level, "action": l.action,
            "created_at": l.created_at.isoformat()
        } for l in recent_logs.scalars().all()],
    }
