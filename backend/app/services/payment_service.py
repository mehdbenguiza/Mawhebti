import uuid
import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.financial import PaymentIntent, PaymentIntentStatus, PaymentIntentType, Donation, PaymentStatus, WalletTransaction
from app.models.campaign import Campaign
from app.repositories.payment_repository import payment_repository
from app.services.payment import get_payment_provider
from app.services.accounting_service import accounting_service
from app.services.ledger_service import ledger_service
from app.services.wallet_service import wallet_service
from app.services.receipt_service import receipt_service

class PaymentService:
    def create_checkout_donation(self, db: Session, campaign: Campaign, donor_id: uuid.UUID, amount: Decimal, provider_name: str) -> str:
        provider = get_payment_provider(provider_name)
        payment_id = str(uuid.uuid4()) # In real scenario, would call provider API
        checkout_url = f"/api/v1/payments/mock/checkout/{payment_id}?amount={amount}&currency=TND"
        
        intent = PaymentIntent(
            intent_type=PaymentIntentType.DONATION,
            campaign_id=campaign.id,
            donor_id=donor_id,
            provider=provider_name,
            provider_payment_id=payment_id,
            checkout_url=checkout_url,
            status=PaymentIntentStatus.CREATED
        )
        payment_repository.create_intent(db, intent)
        return checkout_url

    def create_checkout_topup(self, db: Session, user_id: uuid.UUID, amount: Decimal, provider_name: str) -> str:
        provider = get_payment_provider(provider_name)
        payment_id = str(uuid.uuid4())
        checkout_url = f"/api/v1/payments/mock/checkout/{payment_id}?amount={amount}&currency=TND"
        
        intent = PaymentIntent(
            intent_type=PaymentIntentType.TOPUP,
            campaign_id=None,
            donor_id=user_id,
            provider=provider_name,
            provider_payment_id=payment_id,
            checkout_url=checkout_url,
            status=PaymentIntentStatus.CREATED
        )
        payment_repository.create_intent(db, intent)
        return checkout_url

    def process_webhook(self, event: dict, db: Session):
        if event['type'] == 'payment.success':
            self._process_payment_success(event, db)
        elif event['type'] == 'payment.failed':
            self._process_payment_failed(event, db)

    def _process_payment_success(self, event: dict, db: Session):
        provider_payment_id = event.get('provider_payment_id', '')
        intent = payment_repository.get_intent_by_provider_id(db, provider_payment_id)
        if not intent:
            return

        if intent.intent_type == PaymentIntentType.DONATION:
            self._process_donation_success(intent, event, db)
        elif intent.intent_type == PaymentIntentType.TOPUP:
            self._process_topup_success(intent, event, db)

    def _process_donation_success(self, intent: PaymentIntent, event: dict, db: Session):
        donation = payment_repository.get_donation_by_intent_id(db, intent.id)
        if not donation or donation.payment_status == PaymentStatus.SUCCESS:
            return

        gross = Decimal(str(event.get('amount', float(donation.amount))))
        fees = accounting_service.calculate_fees(gross)
        net = Decimal(str(fees['net']))
        fee = Decimal(str(fees['fee']))

        campaign = db.query(Campaign).filter(Campaign.id == donation.campaign_id).first()
        if not campaign:
            return

        talent_wallet = wallet_service.get_or_create_wallet(campaign.creator_id, db)
        wallet_service.credit(talent_wallet, net, f"DON-{donation.id}", "Don campagne", db)
        ledger_service.record_donation(donation, talent_wallet.id, gross, fee, net, event.get('provider_reference', ''), db)

        donation.payment_status = PaymentStatus.SUCCESS
        donation.net_amount = net
        donation.platform_fee = fee
        intent.status = PaymentIntentStatus.SUCCEEDED

        campaign.current_amount += gross
        campaign.donors_count = (campaign.donors_count or 0) + 1
        campaign.last_donation_at = datetime.datetime.now(datetime.timezone.utc)

        receipt_service.generate(donation, db)

    def _process_topup_success(self, intent: PaymentIntent, event: dict, db: Session):
        if intent.status == PaymentIntentStatus.SUCCEEDED:
            return

        gross = Decimal(str(event.get('amount', 0)))
        wallet = wallet_service.get_or_create_wallet(intent.donor_id, db)
        wallet_service.credit(wallet, gross, f"TOPUP-{intent.id}", "Recharge portefeuille", db)

        intent.status = PaymentIntentStatus.SUCCEEDED

    def _process_payment_failed(self, event: dict, db: Session):
        provider_payment_id = event.get('provider_payment_id', '')
        intent = payment_repository.get_intent_by_provider_id(db, provider_payment_id)
        if intent:
            intent.status = PaymentIntentStatus.FAILED
            if intent.intent_type == PaymentIntentType.DONATION:
                donation = payment_repository.get_donation_by_intent_id(db, intent.id)
                if donation:
                    donation.payment_status = PaymentStatus.FAILED

payment_service = PaymentService()
