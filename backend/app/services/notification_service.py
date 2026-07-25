from sqlalchemy.orm import Session
from sqlalchemy import desc, update, and_
from typing import List, Optional, Tuple
from uuid import UUID

from app.models.messaging import Notification, NotificationType, NotificationSettings
from app.models.user import User

class NotificationService:
    
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
        settings = NotificationService.get_or_create_settings(db, user_id)
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
    def get_unread_count(db: Session, user_id: UUID) -> int:
        return db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.is_seen == False,
            Notification.is_deleted == False
        ).count()

    @staticmethod
    def mark_as_seen(db: Session, user_id: UUID) -> int:
        """Mark all notifications as seen when the dropdown is opened."""
        stmt = update(Notification).where(
            Notification.recipient_id == user_id,
            Notification.is_seen == False
        ).values(is_seen=True)
        result = db.execute(stmt)
        db.commit()
        return result.rowcount

    @staticmethod
    def mark_as_read(db: Session, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        """Mark a specific notification as read."""
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
    def create_notification(
        db: Session,
        recipient_id: UUID,
        notification_type: NotificationType,
        title: str,
        body: str,
        link: Optional[str] = None,
        priority: str = "NORMAL"
    ) -> Optional[Notification]:
        # 1. Vérifier les préférences utilisateur
        settings = NotificationService.get_or_create_settings(db, recipient_id)
        
        # Mappage des désactivations
        if notification_type in [NotificationType.VIDEO_LIKED, NotificationType.VIDEO_COMMENTED] and not settings.likes_enabled:
            return None
        if notification_type in [NotificationType.NEW_MESSAGE] and not settings.messages_enabled:
            return None
        if "RECRUITMENT" in notification_type.name and not settings.recruitment_enabled:
            return None

        # 2. Logique de regroupement (Grouping)
        existing = db.query(Notification).filter(
            Notification.recipient_id == recipient_id,
            Notification.notification_type == notification_type,
            Notification.link == link,
            Notification.is_read == False,
            Notification.is_deleted == False
        ).order_by(desc(Notification.created_at)).first()

        if existing:
            # Met à jour la notification existante pour éviter le spam
            existing.title = title
            existing.body = body
            existing.is_seen = False # Remettre en non-vu
            db.commit()
            db.refresh(existing)
            return existing

        # 3. Création standard
        new_notif = Notification(
            recipient_id=recipient_id,
            notification_type=notification_type,
            priority=priority,
            title=title,
            body=body,
            link=link
        )
        db.add(new_notif)
        db.commit()
        db.refresh(new_notif)
        return new_notif
