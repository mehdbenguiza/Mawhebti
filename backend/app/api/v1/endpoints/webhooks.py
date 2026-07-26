import logging
from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.services.event_bus import event_bus
from app.services.payment import get_payment_provider
from app.repositories.financial_repository import FinancialRepository
from app.models.financial import PaymentIntentStatus

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe Webhook endpoint (ZERO TRUST & IDEMPOTENT).
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    provider = get_payment_provider()
    
    # 1. Verification of the cryptographic signature
    if not provider.verify_webhook_signature(payload, sig_header):
        logger.error("Invalid Stripe webhook signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    try:
        # 2. Parse event safely
        event = provider.parse_webhook_event(payload, sig_header)
        event_type = event["type"]
        data = event["data"]
        provider_reference = event["provider_reference"]
        
        financial_repo = FinancialRepository(db)
        
        # 3. Check Idempotency immediately
        if financial_repo.check_idempotency(provider_reference):
            logger.info(f"Webhook {provider_reference} already processed. Ignoring.")
            return {"status": "success", "message": "Already processed"}
            
        if event_type == "checkout.session.completed":
            # Payment success!
            session = data
            provider_payment_id = session.get("id")
            metadata = session.get("metadata", {})
            campaign_id_str = metadata.get("campaign_id")
            donor_id_str = metadata.get("donor_id")
            
            if not campaign_id_str:
                logger.error("No campaign_id in checkout session metadata")
                return {"status": "error"}
                
            amount_total = session.get("amount_total", 0) / 100.0
            currency = session.get("currency", "eur").upper()
            
            intent = financial_repo.get_payment_intent_by_provider_id(provider_payment_id)
            payment_intent_id = intent.id if intent else None
            
            donor_id = UUID(donor_id_str) if donor_id_str else None
            campaign_id = UUID(campaign_id_str)
            
            # ATOMIC TRANSACTION
            donation, transaction, campaign = financial_repo.process_successful_donation(
                campaign_id=campaign_id,
                donor_id=donor_id,
                payment_intent_id=payment_intent_id,
                amount=amount_total,
                currency=currency,
                provider="STRIPE",
                provider_reference=provider_reference,
                platform_fee=0.00 # For now, no platform fee calculation
            )
            
            if intent:
                financial_repo.update_payment_intent_status(intent.id, PaymentIntentStatus.SUCCEEDED)
                
            # Fire events for notifications & audit
            event_bus.publish("donation.success", event_data={
                "donation_id": str(donation.id),
                "campaign_id": str(campaign.id),
                "donor_id": str(donor_id) if donor_id else None,
                "amount": amount_total,
                "currency": currency
            })
            
            if campaign.status.value == "COMPLETED":
                event_bus.publish("campaign.completed", event_data={"campaign_id": str(campaign.id)})
                
        elif event_type == "checkout.session.expired":
            session = data
            intent = financial_repo.get_payment_intent_by_provider_id(session.get("id"))
            if intent:
                financial_repo.update_payment_intent_status(intent.id, PaymentIntentStatus.EXPIRED)
                
        return {"status": "success"}
        
    except ValueError as ve:
        logger.error(f"Business logic error in webhook: {str(ve)}")
        # We return 200 to Stripe so it doesn't retry on idempotency or business errors
        return {"status": "handled_with_error", "message": str(ve)}
    except Exception as e:
        logger.error(f"System error in webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
