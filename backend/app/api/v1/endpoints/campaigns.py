import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.campaign import Campaign, CampaignStatus
from app.services.campaign_service import CampaignService
from app.services.payment import get_payment_provider

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/")
def create_campaign(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = CampaignService(db)
    return service.create_campaign(current_user, data)

@router.get("/")
def list_campaigns(db: Session = Depends(get_db)):
    # Simple list for MVP
    return db.query(Campaign).filter(Campaign.status == CampaignStatus.ACTIVE).all()

@router.post("/{campaign_id}/request-review")
def request_review(campaign_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = CampaignService(db)
    return service.request_review(campaign_id, current_user)

@router.post("/{campaign_id}/approve")
def approve_campaign(campaign_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = CampaignService(db)
    return service.approve_campaign(campaign_id, current_user)

@router.post("/{campaign_id}/donate")
def donate(campaign_id: UUID, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Initiates a donation by generating a Stripe Checkout Session.
    Does NOT confirm the payment!
    """
    amount = data.get("amount")
    currency = data.get("currency", "EUR")
    
    if not amount or float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Montant invalide")
        
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Cette campagne n'accepte pas de dons.")
        
    provider = get_payment_provider()
    
    metadata = {
        "campaign_id": str(campaign.id),
        "donor_id": str(current_user.id) if current_user else "",
        "campaign_title": campaign.title
    }
    
    intent_data = provider.create_payment_intent(amount=float(amount), currency=currency, metadata=metadata)
    
    return intent_data
