import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.financial import Donation, DonationReceipt
import logging
logger = logging.getLogger(__name__)

class ReceiptService:
    def generate(self, donation, db: Session) -> DonationReceipt:
        # Vérifier qu'un reçu n'existe pas déjà
        existing = db.query(DonationReceipt).filter(DonationReceipt.donation_id == donation.id).first()
        if existing:
            return existing
        
        year = datetime.now(timezone.utc).year
        count = db.query(DonationReceipt).filter(
            DonationReceipt.receipt_number.like(f'REC-{year}-%')
        ).count() + 1
        receipt_number = f"REC-{year}-{count:06d}"
        
        receipt = DonationReceipt(
            donation_id=donation.id,
            receipt_number=receipt_number,
            pdf_url=None,  # PDF généré à la demande
        )
        db.add(receipt)
        db.flush()
        logger.info(f"[Receipt] Reçu {receipt_number} généré pour donation {donation.id}")
        return receipt

receipt_service = ReceiptService()
