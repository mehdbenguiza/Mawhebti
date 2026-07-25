from sqlalchemy.orm import Session
from typing import List, Optional, Tuple, Dict
from uuid import UUID

from app.models.messaging import (
    Notification, NotificationType, NotificationSettings, 
    NotificationCategory, NotificationAction, EntityType, NotificationPriority
)
from app.services.notification_repository import NotificationRepository

class NotificationService:
    
    @staticmethod
    def get_or_create_settings(db: Session, user_id: UUID) -> NotificationSettings:
        return NotificationRepository.get_or_create_settings(db, user_id)

    @staticmethod
    def update_settings(db: Session, user_id: UUID, updates: dict) -> NotificationSettings:
        return NotificationRepository.update_settings(db, user_id, updates)

    @staticmethod
    def get_user_notifications(db: Session, user_id: UUID, page: int = 1, size: int = 20) -> Tuple[List[Notification], int]:
        return NotificationRepository.get_user_notifications(db, user_id, page, size)

    @staticmethod
    def get_summary(db: Session, user_id: UUID) -> Dict[str, int]:
        return NotificationRepository.get_summary(db, user_id)

    @staticmethod
    def mark_as_seen(db: Session, user_id: UUID) -> int:
        return NotificationRepository.mark_as_seen(db, user_id)

    @staticmethod
    def mark_as_read(db: Session, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        return NotificationRepository.mark_as_read(db, notification_id, user_id)

    @staticmethod
    def soft_delete(db: Session, notification_id: UUID, user_id: UUID) -> bool:
        return NotificationRepository.soft_delete(db, notification_id, user_id)

    @staticmethod
    def _get_category_and_priority(notification_type: NotificationType) -> Tuple[NotificationCategory, NotificationPriority]:
        """Détermine la catégorie et la priorité par défaut d'un type de notification."""
        mapping = {
            NotificationType.VIDEO_LIKED: (NotificationCategory.SOCIAL, NotificationPriority.NORMAL),
            NotificationType.VIDEO_COMMENTED: (NotificationCategory.SOCIAL, NotificationPriority.NORMAL),
            NotificationType.VIDEO_APPROVED: (NotificationCategory.ADMINISTRATION, NotificationPriority.HIGH),
            NotificationType.VIDEO_REJECTED: (NotificationCategory.ADMINISTRATION, NotificationPriority.HIGH),
            NotificationType.NEW_MESSAGE: (NotificationCategory.SOCIAL, NotificationPriority.HIGH),
            NotificationType.MESSAGE_BLOCKED: (NotificationCategory.SECURITY, NotificationPriority.HIGH),
            NotificationType.RECRUITMENT_REQUEST: (NotificationCategory.RECRUITMENT, NotificationPriority.HIGH),
            NotificationType.RECRUITMENT_ACCEPTED: (NotificationCategory.RECRUITMENT, NotificationPriority.HIGH),
            NotificationType.RECRUITMENT_REJECTED: (NotificationCategory.RECRUITMENT, NotificationPriority.HIGH),
            NotificationType.RECRUITMENT_STAGE_CHANGED: (NotificationCategory.RECRUITMENT, NotificationPriority.NORMAL),
            NotificationType.TALENT_SAVED: (NotificationCategory.RECRUITMENT, NotificationPriority.NORMAL),
            NotificationType.DONATION_RECEIVED: (NotificationCategory.CROWDFUNDING, NotificationPriority.HIGH),
            NotificationType.CAMPAIGN_COMPLETED: (NotificationCategory.CROWDFUNDING, NotificationPriority.URGENT),
            NotificationType.CAMPAIGN_EXPIRED: (NotificationCategory.CROWDFUNDING, NotificationPriority.HIGH),
            NotificationType.PROFILE_VERIFIED: (NotificationCategory.ADMINISTRATION, NotificationPriority.HIGH),
            NotificationType.ACCOUNT_SUSPENDED: (NotificationCategory.SECURITY, NotificationPriority.URGENT),
            NotificationType.SECURITY_ALERT: (NotificationCategory.SECURITY, NotificationPriority.URGENT),
            NotificationType.PASSWORD_CHANGED: (NotificationCategory.SECURITY, NotificationPriority.HIGH),
            NotificationType.LOGIN_NEW_DEVICE: (NotificationCategory.SECURITY, NotificationPriority.HIGH),
            NotificationType.SYSTEM: (NotificationCategory.ADMINISTRATION, NotificationPriority.NORMAL),
        }
        return mapping.get(notification_type, (NotificationCategory.SOCIAL, NotificationPriority.NORMAL))

    @staticmethod
    def _format_body_from_actors(base_text: str, payload: dict) -> str:
        """
        Formate dynamiquement le texte de la notification selon le nombre d'acteurs.
        Ex: base_text = "a aimé votre vidéo"
        - "Ali a aimé votre vidéo"
        - "Ali et Sarah ont aimé votre vidéo"
        - "Ali, Sarah et 2 autres personnes ont aimé votre vidéo"
        """
        actors = payload.get("actors", [])
        count = payload.get("actors_count", len(actors))
        
        if count == 0:
            return f"Quelqu'un {base_text}"
        
        if count == 1:
            return f"{actors[0]} {base_text}"
        
        # Accord pluriel simplifié
        base_text_pluriel = base_text.replace(" a ", " ont ", 1)
        
        if count == 2:
            name1 = actors[0]
            name2 = actors[1] if len(actors) > 1 else "quelqu'un"
            return f"{name1} et {name2} {base_text_pluriel}"
        
        # 3+ acteurs
        name1 = actors[0]
        others_count = count - 1
        return f"{name1} et {others_count} autres personnes {base_text_pluriel}"

    @staticmethod
    def create_notification(
        db: Session,
        recipient_id: UUID,
        notification_type: NotificationType,
        title: str,
        body: str, # Utilisé comme "base_text" si acteurs dynamiques
        link: Optional[str] = None,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[UUID] = None,
        actor_id: Optional[UUID] = None,
        actor_name: Optional[str] = None,
        action_type: NotificationAction = NotificationAction.NONE
    ) -> Optional[Notification]:
        
        # 1. Vérifier les préférences utilisateur
        settings = NotificationRepository.get_or_create_settings(db, recipient_id)
        
        if notification_type in [NotificationType.VIDEO_LIKED, NotificationType.VIDEO_COMMENTED] and not settings.likes_enabled:
            return None
        if notification_type in [NotificationType.NEW_MESSAGE] and not settings.messages_enabled:
            return None
        if "RECRUITMENT" in notification_type.name and not settings.recruitment_enabled:
            return None

        # 2. Déterminer la catégorie et la priorité
        category, priority = NotificationService._get_category_and_priority(notification_type)

        # 3. Logique de regroupement
        # Seulement si on a un entity_type et entity_id (pour regrouper précisément par vidéo, message, etc.)
        if entity_type and entity_id and actor_name:
            existing = NotificationRepository.get_existing_active_notification(
                db, recipient_id, notification_type, entity_type, entity_id
            )
            
            if existing:
                payload = dict(existing.payload) if existing.payload else {"actors": [], "actor_ids": [], "actors_count": 0}
                
                actor_id_str = str(actor_id) if actor_id else None
                
                # Ajouter l'acteur s'il n'est pas déjà dans la liste (éviter le spam par la même personne)
                if actor_id_str and actor_id_str not in payload["actor_ids"]:
                    payload["actor_ids"].append(actor_id_str)
                    payload["actors"].append(actor_name)
                    payload["actors_count"] += 1
                elif not actor_id_str and actor_name not in payload["actors"]:
                    payload["actors"].append(actor_name)
                    payload["actors_count"] += 1
                
                existing.payload = payload
                existing.body = NotificationService._format_body_from_actors(body, payload)
                existing.is_seen = False
                
                return NotificationRepository.save_notification(db, existing)

        # 4. Création Standard (Première fois ou pas de regroupement possible)
        payload = {}
        final_body = body
        if actor_name:
            payload = {
                "actors": [actor_name],
                "actor_ids": [str(actor_id)] if actor_id else [],
                "actors_count": 1
            }
            final_body = NotificationService._format_body_from_actors(body, payload)

        new_notif = Notification(
            recipient_id=recipient_id,
            notification_type=notification_type,
            priority=priority,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            action_type=action_type,
            created_by=actor_id,
            title=title,
            body=final_body,
            link=link,
            payload=payload,
            channels_sent={"IN_APP": True, "EMAIL": False, "PUSH": False}
        )
        return NotificationRepository.save_notification(db, new_notif)
