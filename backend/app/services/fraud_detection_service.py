from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.financial import Donation, PaymentStatus, FraudCheck, FraudDecision
from app.models.campaign import Campaign
from app.models.user import User
from datetime import datetime, timedelta, timezone
import logging
logger = logging.getLogger(__name__)

class FraudDetectionService:
    MAX_AMOUNT = Decimal('50000')  # TND
    MIN_AMOUNT = Decimal('5')      # TND
    MAX_DONATIONS_PER_HOUR = 10
    ACCOUNT_MIN_AGE_DAYS = 1
    
    def score(self, donor_id, campaign_id, amount: Decimal, db: Session) -> dict:
        reasons = []
        score = 0
        
        # Vérifie que le donateur n'est pas le créateur
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign and str(campaign.creator_id) == str(donor_id):
            reasons.append('AUTO_DON_DÉTECTÉ')
            score += 100
        
        # Montant anormal
        if amount > self.MAX_AMOUNT:
            reasons.append(f'MONTANT_TROP_ÉLEVÉ ({amount} TND)')
            score += 60
        if amount < self.MIN_AMOUNT:
            reasons.append(f'MONTANT_TROP_FAIBLE ({amount} TND)')
            score += 30
        
        # Compte récent
        donor = db.query(User).filter(User.id == donor_id).first()
        if donor and donor.created_at:
            age = datetime.now(timezone.utc) - donor.created_at.replace(tzinfo=timezone.utc)
            if age.days < self.ACCOUNT_MIN_AGE_DAYS:
                reasons.append(f'COMPTE_RÉCENT ({age.days} jour(s))')
                score += 25
        
        # Trop de dons récents
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_donations = db.query(Donation).filter(
            Donation.donor_id == donor_id,
            Donation.created_at >= one_hour_ago,
            Donation.payment_status == PaymentStatus.SUCCESS
        ).count()
        if recent_donations >= self.MAX_DONATIONS_PER_HOUR:
            reasons.append(f'TROP_DE_DONS_PAR_HEURE ({recent_donations})')
            score += 35
        
        score = min(score, 100)
        if score >= 80:
            decision = FraudDecision.REJECTED
        elif score >= 50:
            decision = FraudDecision.SUSPICIOUS
        else:
            decision = FraudDecision.CLEAN
        
        logger.info(f"[Fraud] donor={donor_id} campaign={campaign_id} score={score} decision={decision}")
        return {'risk_score': score, 'decision': decision, 'reasons': reasons}

fraud_detection_service = FraudDetectionService()
