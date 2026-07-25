from typing import Optional, Tuple
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.financial import (
    Donation, FinancialTransaction, PaymentIntent, FraudCheck,
    PaymentStatus, TransactionDirection, TransactionReason, FraudDecision, PaymentIntentStatus
)
from app.models.campaign import Campaign, CampaignStatus

class FinancialRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_payment_intent_by_provider_id(self, provider_id: str) -> Optional[PaymentIntent]:
        return self.db.query(PaymentIntent).filter(PaymentIntent.provider_payment_id == provider_id).first()

    def create_payment_intent(self, intent: PaymentIntent) -> PaymentIntent:
        self.db.add(intent)
        self.db.commit()
        self.db.refresh(intent)
        return intent
        
    def update_payment_intent_status(self, intent_id: UUID, status: PaymentIntentStatus) -> PaymentIntent:
        intent = self.db.query(PaymentIntent).filter(PaymentIntent.id == intent_id).first()
        if intent:
            intent.status = status
            self.db.commit()
            self.db.refresh(intent)
        return intent

    def check_idempotency(self, provider_reference: str) -> bool:
        """Returns True if the transaction already exists."""
        exists = self.db.query(FinancialTransaction).filter(
            FinancialTransaction.provider_reference == provider_reference
        ).first()
        return exists is not None

    def process_successful_donation(
        self, 
        campaign_id: UUID,
        donor_id: Optional[UUID],
        payment_intent_id: Optional[UUID],
        amount: float,
        currency: str,
        provider: str,
        provider_reference: str,
        platform_fee: float = 0.00
    ) -> Tuple[Donation, FinancialTransaction, Campaign]:
        """
        ATOMIC TRANSACTION (BEGIN ... COMMIT)
        Creates a Donation, FinancialTransaction, and updates the Campaign current_amount.
        Rolls back entirely if any step fails.
        """
        # Lock the campaign for update to prevent race conditions on current_amount
        campaign = self.db.query(Campaign).filter(Campaign.id == campaign_id).with_for_update().first()
        if not campaign:
            raise ValueError("Campaign not found")
            
        if self.check_idempotency(provider_reference):
            raise ValueError("Idempotency conflict: transaction already processed.")

        net_amount = amount - platform_fee

        try:
            # 1. Create Donation
            donation = Donation(
                campaign_id=campaign.id,
                donor_id=donor_id,
                payment_intent_id=payment_intent_id,
                amount=amount,
                currency=currency,
                payment_status=PaymentStatus.SUCCESS,
                transaction_reference=provider_reference,
                platform_fee=platform_fee,
                net_amount=net_amount
            )
            self.db.add(donation)
            self.db.flush() # generate ID

            # 2. Create FinancialTransaction (Immutable)
            transaction = FinancialTransaction(
                donation_id=donation.id,
                amount=amount,
                fee=platform_fee,
                net_amount=net_amount,
                transaction_direction=TransactionDirection.INCOMING,
                transaction_reason=TransactionReason.DONATION,
                provider=provider,
                provider_reference=provider_reference,
                status="SUCCESS"
            )
            self.db.add(transaction)
            
            # 3. Update Campaign amount
            campaign.current_amount = float(campaign.current_amount) + net_amount
            
            # Check if target reached automatically
            if campaign.current_amount >= float(campaign.target_amount):
                campaign.status = CampaignStatus.COMPLETED
                
            # COMMIT EVERYTHING AT ONCE (ACID)
            self.db.commit()
            
            self.db.refresh(donation)
            self.db.refresh(transaction)
            self.db.refresh(campaign)
            
            return donation, transaction, campaign

        except Exception as e:
            # ROLLBACK on ANY error
            self.db.rollback()
            raise e
