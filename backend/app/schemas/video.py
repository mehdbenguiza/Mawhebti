from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.video import VideoStatus

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None

class VideoResponse(VideoBase):
    id: UUID
    user_id: UUID
    file_path: str
    status: VideoStatus
    transcription: Optional[str] = None
    ai_tags: Optional[List[str]] = None
    views_count: int
    likes_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class CreatorInfo(BaseModel):
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    trust_level: int
    
class VideoFeedResponse(VideoResponse):
    creator: CreatorInfo
    
    model_config = ConfigDict(from_attributes=True)

class VideoViewCreate(BaseModel):
    session_id: str
    watched_seconds: int = 0
    completed: bool = False

class VideoReportCreate(BaseModel):
    reason: str

class VideoStatsResponse(BaseModel):
    views: int
    likes: int
    liked: bool
