from sqlalchemy.orm import Session
from app.models.financial import PaymentEvent
import logging
logger = logging.getLogger(__name__)

class IdempotencyService:
    def is_already_processed(self, provider_event_id: str, db: Session) -> bool:
        existing = db.query(PaymentEvent).filter(
            PaymentEvent.provider_event_id == provider_event_id
        ).first()
        return existing is not None
    
    def mark_as_processed(self, provider_event_id: str, provider: str, event_type: str, payload: dict, db: Session):
        event = PaymentEvent(
            provider=provider,
            provider_event_id=provider_event_id,
            event_type=event_type,
            payload=payload,
            status='PROCESSED',
        )
        db.add(event)
        db.flush()
        logger.info(f"[Idempotency] Événement {provider_event_id} marqué PROCESSED")

idempotency_service = IdempotencyService()
