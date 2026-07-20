import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class VideoStatus(str, enum.Enum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    PENDING_CONSENT = "PENDING_CONSENT"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"

class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=False)
    status = Column(Enum(VideoStatus, name="videostatus", create_type=False), nullable=False, default=VideoStatus.UPLOADING)
    
    transcription = Column(Text, nullable=True)
    ai_tags = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
