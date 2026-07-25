import logging
from uuid import UUID
from app.services.event_bus import event_bus
from app.services.notification_service import NotificationService
from app.models.messaging import NotificationType, EntityType, NotificationAction
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

def handle_video_liked(event_data: dict):
    db = SessionLocal()
    try:
        recipient_id = event_data.get('video_owner_id')
        liker_name = event_data.get('liker_name', 'Quelqu\'un')
        liker_id = event_data.get('liker_id')
        video_title = event_data.get('video_title', 'votre vidéo')
        video_id = event_data.get('video_id')
        
        # Le service va faire le regroupement et formater "Ali et 2 autres ont aimé..."
        title = "Nouveau Like ❤️"
        base_body = f"aimé votre vidéo : {video_title}" # Sera préfixé par "Ali a" ou "Ali et Sarah ont"
        
        # Redirection vers le profil public du talent où sont affichées ses vidéos
        link = f"/talents/{recipient_id}"

        NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            notification_type=NotificationType.VIDEO_LIKED,
            title=title,
            body=base_body,
            link=link,
            entity_type=EntityType.VIDEO,
            entity_id=video_id,
            actor_id=liker_id,
            actor_name=liker_name,
            action_type=NotificationAction.VIEW
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
        recruiter_id = event_data.get('recruiter_id')
        
        title = "Nouveau Favori ⭐"
        base_body = "vous a ajouté à ses favoris."
        link = "/dashboard"

        NotificationService.create_notification(
            db=db,
            recipient_id=recipient_id,
            notification_type=NotificationType.TALENT_SAVED,
            title=title,
            body=base_body,
            link=link,
            entity_type=EntityType.PROFILE,
            entity_id=recipient_id,
            actor_id=recruiter_id,
            actor_name=recruiter_name,
            action_type=NotificationAction.VIEW
        )
    except Exception as e:
        logger.error(f"Error handling talent.saved event: {e}")
    finally:
        db.close()

# Enregistrement des listeners
event_bus.subscribe("video.liked", handle_video_liked)
event_bus.subscribe("talent.saved", handle_talent_saved)
