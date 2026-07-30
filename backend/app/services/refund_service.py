from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.financial import Donation, PaymentStatus
from app.services.wallet_service import wallet_service
from fastapi import HTTPException
import logging
logger = logging.getLogger(__name__)

class RefundService:
    def process_refund(self, donation_id, admin_id, reason: str, db: Session) -> dict:
        donation = db.query(Donation).filter(Donation.id == donation_id).first()
        if not donation:
            raise HTTPException(404, "Don introuvable")
        if donation.payment_status != PaymentStatus.SUCCESS:
            raise HTTPException(400, f"Impossible de rembourser un don avec statut {donation.payment_status}")
        
        # Débiter le wallet du talent
        if donation.campaign_id:
            from app.models.campaign import Campaign
            campaign = db.query(Campaign).filter(Campaign.id == donation.campaign_id).first()
            if campaign:
                wallet = wallet_service.get_or_create_wallet(campaign.creator_id, db)
                wallet_service.debit(
                    wallet, 
                    donation.net_amount,
                    f"REFUND-{donation.id}",
                    f"Remboursement don {donation.id} - {reason}",
                    db
                )
                # Réduire current_amount de la campagne
                campaign.current_amount -= donation.amount
                if campaign.donors_count > 0:
                    campaign.donors_count -= 1
        
        donation.payment_status = PaymentStatus.REFUNDED
        db.flush()
        logger.info(f"[Refund] Don {donation_id} remboursé par admin {admin_id}")
        return {'status': 'refunded', 'donation_id': str(donation_id), 'amount': float(donation.amount)}

refund_service = RefundService()
