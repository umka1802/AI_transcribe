from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TranscriptionTaskResponse(BaseModel):
    id: int
    user_id: int
    original_filename: str
    file_size: int
    file_format: str
    duration_seconds: Optional[float] = None
    status: str
    language: Optional[str] = None
    result_text: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TranscriptionTaskList(BaseModel):
    items: list[TranscriptionTaskResponse]
    total: int
    page: int
    size: int
