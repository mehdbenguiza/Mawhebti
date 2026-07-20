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
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
