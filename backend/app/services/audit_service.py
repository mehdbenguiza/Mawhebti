import json
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.recruitment import AuditLog
from app.core.database import SessionLocal

class AuditService:
    @staticmethod
    def log_action(entity_type: str, entity_id: UUID, action: str, user_id: UUID = None, old_values: dict = None, new_values: dict = None, metadata: dict = None):
        db = SessionLocal()
        try:
            log = AuditLog(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                user_id=user_id,
                old_values=old_values,
                new_values=new_values,
                metadata_json=metadata
            )
            db.add(log)
            db.commit()
        finally:
            db.close()

# Enregistrement des listeners sur l'EventBus
from app.services.event_bus import event_bus

def handle_audit_event(**kwargs):
    AuditService.log_action(
        entity_type=kwargs.get('entity_type'),
        entity_id=kwargs.get('entity_id'),
        action=kwargs.get('action'),
        user_id=kwargs.get('user_id'),
        old_values=kwargs.get('old_values'),
        new_values=kwargs.get('new_values'),
        metadata=kwargs.get('metadata')
    )

event_bus.subscribe('audit.log', handle_audit_event)
