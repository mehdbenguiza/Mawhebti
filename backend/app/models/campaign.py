import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func, Integer, Numeric, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Currency(str, enum.Enum):
    EUR = "EUR"
    USD = "USD"
    TND = "TND"
    GBP = "GBP"

class OwnerType(str, enum.Enum):
    TALENT = "TALENT"
    PARENT = "PARENT"

class BeneficiaryType(str, enum.Enum):
    PERSON = "PERSON"
    BANK_ACCOUNT = "BANK_ACCOUNT"

class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class CampaignVisibility(str, enum.Enum):
    PUBLIC = 'PUBLIC'
    PRIVATE = 'PRIVATE'
    UNLISTED = 'UNLISTED'

class CampaignVerification(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    IDENTITY_VERIFIED = "IDENTITY_VERIFIED"
    BANK_VERIFIED = "BANK_VERIFIED"
    ADMIN_APPROVED = "ADMIN_APPROVED"

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    beneficiary_id = Column(UUID(as_uuid=True), nullable=False)
    
    owner_type = Column(Enum(OwnerType, native_enum=False, length=50), nullable=False)
    beneficiary_type = Column(Enum(BeneficiaryType, native_enum=False, length=50), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    
    # Financials
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    currency = Column(Enum(Currency, native_enum=False, length=50), nullable=False, default=Currency.EUR)
    
    # Dates
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Visuals & Meta
    visibility = Column(String(50), default="PUBLIC")
    cover_image = Column(String(512), nullable=True)
    video_pitch = Column(String(512), nullable=True)
    location = Column(String(255), nullable=True)
    
    # Status & Security
    status = Column(Enum(CampaignStatus, native_enum=False, length=50), nullable=False, default=CampaignStatus.DRAFT, index=True)
    admin_comment = Column(Text, nullable=True)
    verification_level = Column(Enum(CampaignVerification, native_enum=False, length=50), nullable=False, default=CampaignVerification.UNVERIFIED)
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Optimistic Locking
    version = Column(Integer, default=1, nullable=False)
    
    # Soft Delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Sprint 9.1 Social fields
    invite_code = Column(String(12), nullable=True, unique=True)
    views_count = Column(Integer, default=0, nullable=False, server_default='0')
    shares_count = Column(Integer, default=0, nullable=False, server_default='0')
    favorites_count = Column(Integer, default=0, nullable=False, server_default='0')
    comments_count = Column(Integer, default=0, nullable=False, server_default='0')
    donors_count = Column(Integer, default=0, nullable=False, server_default='0')
    last_donation_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('target_amount >= 10 AND target_amount <= 100000', name='check_target_amount_range'),
        CheckConstraint('current_amount >= 0', name='check_current_amount_positive'),
        CheckConstraint('end_date > start_date', name='check_end_date_after_start_date'),
    )
    
    # Setting up SQLAlchemy Optimistic Locking
    __mapper_args__ = {
        "version_id_col": version
    }

class CampaignAudit(Base):
    __tablename__ = "campaign_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    old_status = Column(String(100), nullable=True)
    new_status = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
