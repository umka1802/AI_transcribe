from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models.user import User
from ..models.task import TranscriptionTask
from ..utils.deps import get_current_user
from ..services.export_service import export_service

router = APIRouter(prefix="/api/export", tags=["export"])

ALLOWED_FORMATS = {"txt", "docx", "pdf", "srt"}


@router.get("/{task_id}/{fmt}")
async def export_task(
    task_id: int,
    fmt: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if fmt not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")

    result = await db.execute(select(TranscriptionTask).where(
        TranscriptionTask.id == task_id,
        TranscriptionTask.user_id == current_user.id,
    ))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "completed" or not task.result_text:
        raise HTTPException(status_code=400, detail="No completed result available")

    text = task.result_text
    content_type = "text/plain"
    filename = f"{task.original_filename.rsplit('.', 1)[0]}.{fmt}"

    if fmt == "txt":
        content = export_service.export_txt(text)
        content_type = "text/plain; charset=utf-8"
    elif fmt == "docx":
        content = export_service.export_docx(text)
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif fmt == "pdf":
        content = export_service.export_pdf(text)
        content_type = "application/pdf"
    elif fmt == "srt":
        content = export_service.export_srt(text, None)
        content_type = "text/plain; charset=utf-8"
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
