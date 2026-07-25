from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.notification import (
    NotificationListResponse, NotificationResponse, 
    NotificationSettingsResponse, NotificationSettingsBase,
    NotificationSummaryResponse
)

router = APIRouter()

@router.get("", response_model=NotificationListResponse)
def get_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs, total = NotificationService.get_user_notifications(db, current_user.id, page, size)
    return NotificationListResponse(
        items=notifs,
        total=total,
        page=page,
        size=size
    )

@router.get("/summary", response_model=NotificationSummaryResponse)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = NotificationService.get_summary(db, current_user.id)
    return summary

@router.put("/seen")
def mark_all_as_seen(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as seen (for the bell icon)."""
    count = NotificationService.mark_as_seen(db, current_user.id)
    return {"message": f"{count} notifications marked as seen"}

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = NotificationService.soft_delete(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

@router.get("/settings", response_model=NotificationSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = NotificationService.get_or_create_settings(db, current_user.id)
    return settings

@router.put("/settings", response_model=NotificationSettingsResponse)
def update_settings(
    settings_data: NotificationSettingsBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = NotificationService.update_settings(db, current_user.id, settings_data.model_dump())
    return settings
