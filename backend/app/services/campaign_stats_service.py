from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timezone

from app.models.campaign import Campaign, CampaignStatus
from app.models.financial import Donation, PaymentStatus, FinancialTransaction

class CampaignStatsService:
    def __init__(self, db: Session):
        self.db = db

    def get_talent_dashboard_kpis(self, user_id: UUID) -> dict:
        """
        Returns the KPIs for a talent/parent.
        They can have max 3 campaigns, we sum up or return per campaign.
        Let's return aggregate stats and a list of active campaigns.
        """
        campaigns = self.db.query(Campaign).filter(
            Campaign.creator_id == user_id,
            Campaign.is_deleted == False
        ).all()
        
        total_target = sum([float(c.target_amount) for c in campaigns])
        total_collected = sum([float(c.current_amount) for c in campaigns])
        
        campaign_ids = [c.id for c in campaigns]
        
        # Donors count
        donors_count = self.db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.campaign_id.in_(campaign_ids),
            Donation.payment_status == PaymentStatus.SUCCESS
        ).scalar() or 0
        
        # Total donations count
        donations_count = self.db.query(func.count(Donation.id)).filter(
            Donation.campaign_id.in_(campaign_ids),
            Donation.payment_status == PaymentStatus.SUCCESS
        ).scalar() or 0
        
        avg_donation = total_collected / donations_count if donations_count > 0 else 0
        
        return {
            "total_target": total_target,
            "total_collected": total_collected,
            "progress_percentage": round((total_collected / total_target * 100) if total_target > 0 else 0, 2),
            "donors_count": donors_count,
            "donations_count": donations_count,
            "average_donation": round(avg_donation, 2),
            "campaigns": [{
                "id": c.id,
                "title": c.title,
                "status": c.status.value,
                "target": float(c.target_amount),
                "collected": float(c.current_amount)
            } for c in campaigns]
        }
