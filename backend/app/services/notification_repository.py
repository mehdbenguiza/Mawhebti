from sqlalchemy.orm import Session
from sqlalchemy import desc, update, and_
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID

from app.models.messaging import (
    Notification, NotificationType, NotificationSettings, 
    NotificationCategory, NotificationAction, EntityType
)

class NotificationRepository:
    
    @staticmethod
    def get_or_create_settings(db: Session, user_id: UUID) -> NotificationSettings:
        settings = db.query(NotificationSettings).filter(NotificationSettings.user_id == user_id).first()
        if not settings:
            settings = NotificationSettings(user_id=user_id)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    @staticmethod
    def update_settings(db: Session, user_id: UUID, updates: dict) -> NotificationSettings:
        settings = NotificationRepository.get_or_create_settings(db, user_id)
        for key, value in updates.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        db.commit()
        db.refresh(settings)
        return settings

    @staticmethod
    def get_user_notifications(db: Session, user_id: UUID, page: int = 1, size: int = 20) -> Tuple[List[Notification], int]:
        query = db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_deleted == False
        )
        total = query.count()
        notifications = query.order_by(desc(Notification.created_at))\
                             .offset((page - 1) * size)\
                             .limit(size)\
                             .all()
        return notifications, total

    @staticmethod
    def get_summary(db: Session, user_id: UUID) -> Dict[str, int]:
        query = db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_deleted == False
        )
        total = query.count()
        unread = query.filter(Notification.is_read == False).count()
        unseen = query.filter(Notification.is_seen == False).count()
        high_priority = query.filter(Notification.priority.in_(["HIGH", "URGENT"])).count()
        urgent = query.filter(Notification.priority == "URGENT").count()
        
        return {
            "total": total,
            "unread": unread,
            "unseen": unseen,
            "high_priority": high_priority,
            "urgent": urgent
        }

    @staticmethod
    def mark_as_seen(db: Session, user_id: UUID) -> int:
        stmt = update(Notification).where(
            and_(
                Notification.recipient_id == user_id,
                Notification.is_seen == False
            )
        ).values(is_seen=True)
        result = db.execute(stmt)
        db.commit()
        return result.rowcount

    @staticmethod
    def mark_as_read(db: Session, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def soft_delete(db: Session, notification_id: UUID, user_id: UUID) -> bool:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.recipient_id == user_id
        ).first()
        if notification:
            notification.is_deleted = True
            db.commit()
            return True
        return False

    @staticmethod
    def get_existing_active_notification(
        db: Session, 
        recipient_id: UUID, 
        notification_type: NotificationType, 
        entity_type: Optional[EntityType], 
        entity_id: Optional[UUID]
    ) -> Optional[Notification]:
        """
        Trouve une notification existante (non lue, non supprimée) pour un type, une entité et un destinataire donnés,
        afin de pouvoir la regrouper.
        """
        query = db.query(Notification).filter(
            Notification.recipient_id == recipient_id,
            Notification.notification_type == notification_type,
            Notification.is_read == False,
            Notification.is_deleted == False
        )
        
        if entity_type and entity_id:
            query = query.filter(
                Notification.entity_type == entity_type,
                Notification.entity_id == entity_id
            )
            
        return query.order_by(desc(Notification.created_at)).first()

    @staticmethod
    def save_notification(db: Session, notification: Notification) -> Notification:
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
