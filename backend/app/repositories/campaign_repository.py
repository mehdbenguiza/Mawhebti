import random
import string
from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime, timezone

from app.models.campaign import Campaign, CampaignStatus
from app.models.campaign_social import CampaignComment, CampaignFavorite, CampaignReport
from app.models.financial import Donation
from app.models.user import User

def _generate_invite_code() -> str:
    """Génère un code aléatoire CHAR(12) style DISCORD."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=12))

class CampaignRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(Campaign).filter(Campaign.is_deleted == False)

    def get_public_campaigns(
        self,
        title: Optional[str] = None,
        category: Optional[str] = None,
        location: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        ending_before: Optional[datetime] = None,
        ending_after: Optional[datetime] = None,
        sort: str = 'recent',
        page: int = 1,
        page_size: int = 12
    ):
        q = self._base_query().filter(
            Campaign.status == CampaignStatus.ACTIVE,
            Campaign.visibility == 'PUBLIC'
        )
        if title:
            q = q.filter(Campaign.title.ilike(f'%{title}%'))
        if category:
            q = q.filter(Campaign.category == category)
        if location:
            q = q.filter(Campaign.location.ilike(f'%{location}%'))
        if min_amount is not None:
            q = q.filter(Campaign.current_amount >= min_amount)
        if max_amount is not None:
            q = q.filter(Campaign.target_amount <= max_amount)
        if ending_before:
            q = q.filter(Campaign.end_date <= ending_before)
        if ending_after:
            q = q.filter(Campaign.end_date >= ending_after)

        sort_map = {
            'recent': desc(Campaign.created_at),
            'most_funded': desc(Campaign.current_amount),
            'popular': desc(Campaign.views_count),
            'ending_soon': asc(Campaign.end_date),
        }
        q = q.order_by(sort_map.get(sort, desc(Campaign.created_at)))
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_by_id(self, campaign_id: UUID) -> Optional[Campaign]:
        return self._base_query().filter(Campaign.id == campaign_id).first()

    def get_by_invite_code(self, code: str) -> Optional[Campaign]:
        return self._base_query().filter(
            Campaign.invite_code == code,
            Campaign.visibility.in_(['PRIVATE', 'UNLISTED'])
        ).first()

    def get_mine(self, creator_id: UUID, page: int = 1, page_size: int = 20):
        q = self._base_query().filter(Campaign.creator_id == creator_id).order_by(desc(Campaign.created_at))
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_children_campaigns(self, child_ids: List[UUID], page: int = 1, page_size: int = 20):
        q = self._base_query().filter(Campaign.creator_id.in_(child_ids)).order_by(desc(Campaign.created_at))
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_statistics(self, campaign_id: UUID) -> dict:
        campaign = self.get_by_id(campaign_id)
        if not campaign:
            return {}
        avg_donation = self.db.query(func.avg(Donation.amount)).filter(
            Donation.campaign_id == campaign_id,
            Donation.payment_status == 'SUCCESS'
        ).scalar()
        return {
            'campaign_id': campaign_id,
            'views_count': campaign.views_count,
            'shares_count': campaign.shares_count,
            'favorites_count': campaign.favorites_count,
            'donors_count': campaign.donors_count,
            'comments_count': campaign.comments_count,
            'current_amount': campaign.current_amount,
            'target_amount': campaign.target_amount,
            'completion_percentage': float(campaign.current_amount / campaign.target_amount * 100) if campaign.target_amount else 0,
            'last_donation_at': campaign.last_donation_at,
            'average_donation': avg_donation,
        }

    def get_donors(self, campaign_id: UUID, page: int = 1, page_size: int = 20):
        q = self.db.query(Donation).filter(
            Donation.campaign_id == campaign_id,
            Donation.payment_status == 'SUCCESS'
        ).order_by(desc(Donation.created_at))
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_comments(self, campaign_id: UUID, page: int = 1, page_size: int = 20):
        q = self.db.query(CampaignComment).filter(
            CampaignComment.campaign_id == campaign_id,
            CampaignComment.deleted_at == None,
            CampaignComment.parent_comment_id == None
        ).order_by(desc(CampaignComment.created_at))
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def soft_delete(self, campaign: Campaign, user_id: UUID):
        campaign.is_deleted = True
        campaign.deleted_at = datetime.now(timezone.utc)
        campaign.deleted_by = user_id
        self.db.commit()

    def publish(self, campaign: Campaign):
        campaign.status = CampaignStatus.PENDING_REVIEW
        campaign.published_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def pause(self, campaign: Campaign):
        campaign.status = CampaignStatus.PAUSED
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def cancel(self, campaign: Campaign):
        campaign.status = CampaignStatus.CANCELLED
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def generate_invite_code(self, campaign: Campaign):
        code = _generate_invite_code()
        # Ensure uniqueness
        while self.db.query(Campaign).filter(Campaign.invite_code == code).first():
            code = _generate_invite_code()
        campaign.invite_code = code
        self.db.commit()
        self.db.refresh(campaign)
        return code

    def toggle_favorite(self, campaign_id: UUID, user_id: UUID) -> bool:
        existing = self.db.query(CampaignFavorite).filter(
            CampaignFavorite.campaign_id == campaign_id,
            CampaignFavorite.user_id == user_id
        ).first()
        if existing:
            self.db.delete(existing)
            campaign = self.get_by_id(campaign_id)
            if campaign and campaign.favorites_count > 0:
                campaign.favorites_count -= 1
            self.db.commit()
            return False
        else:
            fav = CampaignFavorite(campaign_id=campaign_id, user_id=user_id)
            self.db.add(fav)
            campaign = self.get_by_id(campaign_id)
            if campaign:
                campaign.favorites_count += 1
            self.db.commit()
            return True

    def add_comment(self, campaign_id: UUID, author_id: UUID, content: str, parent_comment_id: Optional[UUID] = None) -> CampaignComment:
        comment = CampaignComment(
            campaign_id=campaign_id,
            author_id=author_id,
            content=content,
            parent_comment_id=parent_comment_id
        )
        self.db.add(comment)
        campaign = self.get_by_id(campaign_id)
        if campaign:
            campaign.comments_count += 1
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def add_report(self, campaign_id: UUID, reporter_id: UUID, reason: str, description: Optional[str] = None) -> CampaignReport:
        report = CampaignReport(
            campaign_id=campaign_id,
            reporter_id=reporter_id,
            reason=reason,
            description=description
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def increment_views(self, campaign_id: UUID):
        campaign = self.get_by_id(campaign_id)
        if campaign:
            campaign.views_count += 1
            self.db.commit()

    # ─── Méthodes utilisées par CampaignService ──────────────────────────────

    def count_active_by_creator(self, creator_id: UUID) -> int:
        """Compte les campagnes non-terminées d'un créateur."""
        return self.db.query(Campaign).filter(
            Campaign.creator_id == creator_id,
            Campaign.is_deleted == False,
            Campaign.status.in_([
                CampaignStatus.DRAFT,
                CampaignStatus.PENDING_REVIEW,
                CampaignStatus.ACTIVE,
                CampaignStatus.PAUSED,
            ])
        ).count()

    def create(self, campaign: Campaign) -> Campaign:
        """Persiste une nouvelle campagne en base."""
        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def update(self, campaign: Campaign) -> Campaign:
        """Sauvegarde les modifications d'une campagne existante."""
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def get_by_id_with_lock(self, campaign_id: UUID) -> Optional[Campaign]:
        """Récupère une campagne avec verrou SELECT FOR UPDATE (évite les race conditions)."""
        return self.db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.is_deleted == False
        ).with_for_update().first()

    def log_audit(self, audit) -> None:
        """Enregistre un audit dans la table campaign_audits."""
        self.db.add(audit)
        self.db.commit()
