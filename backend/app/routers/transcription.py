import os
import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from ..database import get_db, async_session
from ..models.user import User
from ..models.task import TranscriptionTask
from ..schemas.task import TranscriptionTaskResponse, TranscriptionTaskList
from ..utils.deps import get_current_user
from ..utils.logging import log_action
from ..services.audio_service import validate_audio_file, save_upload, get_file_path, delete_file
from ..services.transcription_service import transcription_service
from ..config import settings

router = APIRouter(prefix="/api/transcription", tags=["transcription"])


@router.post("/upload")
async def upload_audio(
    request: Request,
    file: UploadFile = File(...),
    language: str = Form("auto"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ext, file_size = await validate_audio_file(file)
    file_info = await save_upload(file, current_user.id)

    total_tasks = await db.execute(
        select(func.count(TranscriptionTask.id)).where(TranscriptionTask.user_id == current_user.id)
    )
    if total_tasks.scalar() >= settings.MAX_UPLOADS_PER_USER:
        raise HTTPException(status_code=400, detail="Upload limit reached")

    task = TranscriptionTask(
        user_id=current_user.id,
        filename=file_info["filename"],
        original_filename=file_info["original_filename"],
        file_size=file_info["file_size"],
        file_format=file_info["file_format"],
        status="uploaded",
        language=language if language != "auto" else None,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    await log_action(db, "INFO", "file_uploaded", current_user.id,
                     f"File {file_info['original_filename']} uploaded", request.client.host)

    return {"task_id": task.id, "filename": file_info["original_filename"], "status": "uploaded"}


async def _run_transcription(task_id: int, user_id: int, file_path: str, language: str | None):
    async with async_session() as db:
        try:
            result = await db.execute(select(TranscriptionTask).where(
                TranscriptionTask.id == task_id,
                TranscriptionTask.user_id == user_id,
            ))
            task = result.scalar_one_or_none()
            if not task:
                return

            result_data = await transcription_service.transcribe(file_path, language)

            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()

            if "error" in result_data and result_data["error"]:
                task.status = "error"
                task.error_message = result_data["error"]
            else:
                task.status = "completed"
                task.result_text = result_data.get("text", "")
                task.language = result_data.get("language", task.language)
                task.duration_seconds = result_data.get("duration")
                from datetime import datetime, timezone
                task.completed_at = datetime.now(timezone.utc)

                if user:
                    user.total_transcriptions += 1
                    user.storage_used += task.file_size

            await db.commit()
            from ..utils.logging import log_action
            await log_action(db, "INFO", "transcription_completed" if task.status == "completed" else "transcription_error",
                             user_id, f"Task {task_id}: {task.status}")

        except Exception as e:
            try:
                task.status = "error"
                task.error_message = str(e)
                await db.commit()
                from ..utils.logging import log_action
                await log_action(db, "ERROR", "transcription_failed", user_id,
                                 f"Task {task_id}: {str(e)}")
            except Exception:
                pass


@router.post("/{task_id}/transcribe")
async def start_transcription(
    task_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TranscriptionTask).where(
        TranscriptionTask.id == task_id,
        TranscriptionTask.user_id == current_user.id,
    ))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status not in ("uploaded", "error"):
        raise HTTPException(status_code=400, detail=f"Invalid status: {task.status}")

    file_path = get_file_path(current_user.id, task.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    task.status = "processing"
    await db.commit()

    await log_action(db, "INFO", "transcription_started", current_user.id,
                     f"Task {task_id} started", request.client.host)

    lang = task.language if task.language else None
    asyncio.create_task(_run_transcription(task.id, current_user.id, file_path, lang))

    return {"task_id": task.id, "status": "processing"}


@router.get("/tasks", response_model=TranscriptionTaskList)
async def list_tasks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * size
    total_q = await db.execute(
        select(func.count(TranscriptionTask.id)).where(TranscriptionTask.user_id == current_user.id)
    )
    total = total_q.scalar()

    result = await db.execute(
        select(TranscriptionTask)
        .where(TranscriptionTask.user_id == current_user.id)
        .order_by(desc(TranscriptionTask.created_at))
        .offset(offset).limit(size)
    )
    tasks = result.scalars().all()

    return TranscriptionTaskList(items=tasks, total=total, page=page, size=size)


@router.get("/tasks/{task_id}", response_model=TranscriptionTaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TranscriptionTask).where(
        TranscriptionTask.id == task_id,
        TranscriptionTask.user_id == current_user.id,
    ))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TranscriptionTask).where(
        TranscriptionTask.id == task_id,
        TranscriptionTask.user_id == current_user.id,
    ))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    file_path = get_file_path(current_user.id, task.filename)
    delete_file(file_path)

    await db.delete(task)
    await db.commit()

    await log_action(db, "INFO", "task_deleted", current_user.id,
                     f"Task {task_id} deleted", request.client.host)

    return {"message": "Task deleted"}
