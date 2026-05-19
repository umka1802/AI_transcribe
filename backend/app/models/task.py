from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func, Float
from sqlalchemy.orm import relationship
from ..database import Base


class TranscriptionTask(Base):
    __tablename__ = "transcription_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_format = Column(String, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    status = Column(String, default="uploaded")
    language = Column(String, nullable=True)
    result_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="tasks")
