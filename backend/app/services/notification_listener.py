import logging
from app.services.event_bus import event_bus
from app.services.notification_service import NotificationService
from app.models.messaging import NotificationType
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

def handle_video_liked(event_data: dict):
    db = SessionLocal()
    try:
        recipient_id = event_data.get('video_owner_id')
        liker_name = event_data.get('liker_name', 'Quelqu\'un')
        video_title = event_data.get('video_title', 'votre vidéo')
        video_id = event_data.get('video_id')
        
        # Le service va faire le regroupement automatiquement si nécessaire
        title = "Nouveau Like ❤️"
        body = f"{liker_name} a aimé votre vidéo : {video_title}"
        link = f"/dashboard/videos/{video_id}"

        NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            notification_type=NotificationType.VIDEO_LIKED,
            title=title,
            body=body,
            link=link
        )
    except Exception as e:
        logger.error(f"Error handling video.liked event: {e}")
    finally:
        db.close()


def handle_talent_saved(event_data: dict):
    db = SessionLocal()
    try:
        recipient_id = event_data.get('talent_id')
        recruiter_name = event_data.get('recruiter_name', 'Un recruteur')
        
        title = "Nouveau Favori ⭐"
        body = f"{recruiter_name} vous a ajouté à ses favoris."
        link = "/dashboard"

        NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            notification_type=NotificationType.TALENT_SAVED,
            title=title,
            body=body,
            link=link
        )
    except Exception as e:
        logger.error(f"Error handling talent.saved event: {e}")
    finally:
        db.close()

# Enregistrement des listeners
event_bus.subscribe("video.liked", handle_video_liked)
event_bus.subscribe("talent.saved", handle_talent_saved)
