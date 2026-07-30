from typing import Optional
from sqlalchemy.orm import Session
from app.models.financial import PaymentIntent, PaymentEvent, Donation
from uuid import UUID

class PaymentRepository:
    def get_intent_by_provider_id(self, db: Session, provider_payment_id: str) -> Optional[PaymentIntent]:
        return db.query(PaymentIntent).filter(PaymentIntent.provider_payment_id == provider_payment_id).first()

    def create_intent(self, db: Session, intent: PaymentIntent) -> PaymentIntent:
        db.add(intent)
        db.flush()
        return intent

    def get_donation_by_intent_id(self, db: Session, intent_id: UUID) -> Optional[Donation]:
        return db.query(Donation).filter(Donation.payment_intent_id == intent_id).first()

payment_repository = PaymentRepository()
