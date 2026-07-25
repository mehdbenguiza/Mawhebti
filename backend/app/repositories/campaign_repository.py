from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from uuid import UUID
from fastapi import HTTPException, status

from app.models.campaign import Campaign, CampaignStatus, CampaignAudit, CampaignVerification

class CampaignRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, campaign_id: UUID) -> Optional[Campaign]:
        return self.db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.is_deleted == False
        ).first()

    def get_by_id_with_lock(self, campaign_id: UUID) -> Optional[Campaign]:
        """Gets a campaign with FOR UPDATE to prevent race conditions during financial transactions."""
        return self.db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.is_deleted == False
        ).with_for_update().first()

    def create(self, campaign: Campaign) -> Campaign:
        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def update(self, campaign: Campaign) -> Campaign:
        # Optimistic locking is handled automatically by SQLAlchemy due to version_id_col
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def count_active_by_creator(self, creator_id: UUID) -> int:
        return self.db.query(Campaign).filter(
            Campaign.creator_id == creator_id,
            Campaign.status == CampaignStatus.ACTIVE,
            Campaign.is_deleted == False
        ).count()

    def soft_delete(self, campaign: Campaign, deleted_by: UUID) -> Campaign:
        campaign.is_deleted = True
        campaign.deleted_by = deleted_by
        campaign.status = CampaignStatus.CANCELLED
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def log_audit(self, audit: CampaignAudit) -> CampaignAudit:
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        return audit
