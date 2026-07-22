import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func, JSON, Integer, UniqueConstraint, Boolean
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
    
    views_count = Column(Integer, default=0, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")

class VideoLike(Base):
    __tablename__ = "video_likes"
    __table_args__ = (
        UniqueConstraint("user_id", "video_id", name="uix_user_video_like"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VideoView(Base):
    __tablename__ = "video_views"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    watched_seconds = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VideoReport(Base):
    __tablename__ = "video_reports"
    __table_args__ = (
        UniqueConstraint("user_id", "video_id", name="uix_user_video_report"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
