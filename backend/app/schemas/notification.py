from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.messaging import NotificationType, NotificationPriority

class NotificationBase(BaseModel):
    title: str
    body: str
    link: Optional[str] = None
    notification_type: NotificationType
    priority: NotificationPriority

class NotificationResponse(NotificationBase):
    id: UUID
    recipient_id: UUID
    is_seen: bool
    is_read: bool
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    page: int
    size: int

class NotificationSettingsBase(BaseModel):
    likes_enabled: bool = True
    messages_enabled: bool = True
    recruitment_enabled: bool = True
    crowdfunding_enabled: bool = True
    emails_enabled: bool = True

class NotificationSettingsResponse(NotificationSettingsBase):
    user_id: UUID
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
