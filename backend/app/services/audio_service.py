import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from ..config import settings


ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a", "ogg", "aac", "flac"}


async def validate_audio_file(file: UploadFile) -> tuple[str, int]:
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    content = await file.read()
    file_size = len(content)
    await file.seek(0)

    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    return ext, file_size


async def save_upload(file: UploadFile, user_id: int) -> dict:
    ext, file_size = await validate_audio_file(file)
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, unique_name)

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {
        "filename": unique_name,
        "original_filename": file.filename,
        "file_path": file_path,
        "file_size": file_size,
        "file_format": ext,
    }


def get_file_path(user_id: int, filename: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, str(user_id), filename)


def delete_file(file_path: str):
    if os.path.exists(file_path):
        os.remove(file_path)
