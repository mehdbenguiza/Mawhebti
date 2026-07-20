from uuid import UUID
from sqlalchemy.orm import Session
from app.models.messaging import Notification
from app.core.database import SessionLocal

class NotificationService:
    @staticmethod
    def send_notification(recipient_id: UUID, notification_type: str, title: str, body: str, link: str = None, priority: str = "NORMAL"):
        db = SessionLocal()
        try:
            notif = Notification(
                recipient_id=recipient_id,
                notification_type=notification_type,
                title=title,
                body=body,
                link=link,
                priority=priority
            )
            db.add(notif)
            db.commit()
        finally:
            db.close()

from app.services.event_bus import event_bus

def handle_notification_event(**kwargs):
    NotificationService.send_notification(
        recipient_id=kwargs.get('recipient_id'),
        notification_type=kwargs.get('notification_type'),
        title=kwargs.get('title'),
        body=kwargs.get('body'),
        link=kwargs.get('link'),
        priority=kwargs.get('priority', 'NORMAL')
    )

event_bus.subscribe('notification.send', handle_notification_event)
