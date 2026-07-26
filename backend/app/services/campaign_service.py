from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Dict, Any

from app.models.campaign import (
    Campaign, CampaignStatus, CampaignAudit, CampaignVerification,
    OwnerType, BeneficiaryType
)
from app.models.user import User, UserRole, UserVerificationLevel
from app.models.parent_child import ParentChildLink, LinkStatus
from app.repositories.campaign_repository import CampaignRepository
from app.services.event_bus import event_bus

class CampaignService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = CampaignRepository(db)

    def create_campaign(self, creator: User, data: Dict[str, Any]) -> Campaign:
        """
        Creates a campaign enforcing the Zero Trust rules.
        """
        # 1. Verification of maximum campaigns limit
        active_count = self.repository.count_active_by_creator(creator.id)
        if active_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez atteint la limite de 3 campagnes actives."
            )

        # 2. Determine beneficiary and ownership (Zero Trust)
        beneficiary_id = None
        owner_type = None
        beneficiary_type = BeneficiaryType.PERSON

        if creator.role == UserRole.TALENT_MINOR:
            # Enforce Minor -> Parent logic
            link = self.db.query(ParentChildLink).filter(
                ParentChildLink.child_id == creator.id,
                ParentChildLink.status == LinkStatus.APPROVED
            ).first()

            if not link or not link.parent_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Un talent mineur doit avoir un parent approuvé pour créer une campagne."
                )

            parent = self.db.query(User).filter(User.id == link.parent_id).first()
            if not parent:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent non trouvé.")

            # Beneficiary is ALWAYS the parent
            beneficiary_id = parent.id
            owner_type = OwnerType.TALENT
            
            # Optionally check if parent has KYC, though this can be checked before going ACTIVE
            # We enforce it later in `approve_campaign`
            
        elif creator.role == UserRole.TALENT_MAJOR:
            beneficiary_id = creator.id
            owner_type = OwnerType.TALENT
        elif creator.role == UserRole.PARENT:
            beneficiary_id = creator.id
            owner_type = OwnerType.PARENT
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seuls les talents et parents peuvent créer une campagne."
            )

        # 3. Create the model
        campaign = Campaign(
            creator_id=creator.id,
            beneficiary_id=beneficiary_id,
            owner_type=owner_type,
            beneficiary_type=beneficiary_type,
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            target_amount=data.get('target_amount'),
            currency=data.get('currency', 'EUR'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            visibility=data.get('visibility', 'PUBLIC'),
            cover_image=data.get('cover_image'),
            video_pitch=data.get('video_pitch'),
            location=data.get('location'),
            status=CampaignStatus.DRAFT,
            verification_level=CampaignVerification.UNVERIFIED
        )

        campaign = self.repository.create(campaign)

        # Log audit
        audit = CampaignAudit(
            campaign_id=campaign.id,
            action="CREATED",
            performed_by=creator.id,
            new_status=CampaignStatus.DRAFT.value
        )
        self.repository.log_audit(audit)

        event_bus.publish("campaign.created", event_data={"campaign_id": str(campaign.id)})
        return campaign

    def request_review(self, campaign_id: UUID, user: User) -> Campaign:
        campaign = self.repository.get_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        if campaign.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        if campaign.status != CampaignStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Campaign must be in DRAFT to request review")
            
        campaign.status = CampaignStatus.PENDING_REVIEW
        campaign = self.repository.update(campaign)
        
        audit = CampaignAudit(
            campaign_id=campaign.id,
            action="REVIEW_REQUESTED",
            performed_by=user.id,
            old_status=CampaignStatus.DRAFT.value,
            new_status=CampaignStatus.PENDING_REVIEW.value
        )
        self.repository.log_audit(audit)
        
        event_bus.publish("campaign.review_requested", event_data={"campaign_id": str(campaign.id)})
        return campaign

    def approve_campaign(self, campaign_id: UUID, admin: User) -> Campaign:
        """Admin approves a campaign. Enforces KYC verification level here."""
        if admin.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can approve campaigns")
            
        campaign = self.repository.get_by_id_with_lock(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
            
        # Verify the beneficiary's KYC
        beneficiary = self.db.query(User).filter(User.id == campaign.beneficiary_id).first()
        if not beneficiary:
            raise HTTPException(status_code=404, detail="Beneficiary not found")
            
        if beneficiary.verification_level not in [UserVerificationLevel.KYC_VERIFIED, UserVerificationLevel.BANK_VERIFIED]:
            raise HTTPException(
                status_code=400, 
                detail="Le bénéficiaire (ou Parent) n'est pas vérifié (KYC/Bank). Approbation impossible."
            )
            
        old_status = campaign.status
        campaign.status = CampaignStatus.ACTIVE
        campaign.verification_level = CampaignVerification.ADMIN_APPROVED
        campaign = self.repository.update(campaign)
        
        audit = CampaignAudit(
            campaign_id=campaign.id,
            action="APPROVED",
            performed_by=admin.id,
            old_status=old_status.value,
            new_status=CampaignStatus.ACTIVE.value
        )
        self.repository.log_audit(audit)
        
        event_bus.publish("campaign.approved", event_data={"campaign_id": str(campaign.id)})
        return campaign
