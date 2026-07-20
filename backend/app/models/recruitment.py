import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class RecruitmentRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class RecruitmentRequest(Base):
    __tablename__ = "recruitment_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_talent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(Enum(RecruitmentRequestStatus), nullable=False, default=RecruitmentRequestStatus.PENDING)
    message = Column(Text, nullable=True) # Introduction message
    
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints to avoid spam: a recruiter can only have 1 active request per talent
    # Since status can change, we handle uniqueness at logic level or partial index, but for simplicity:
    # A single constraint might block multiple rejected requests. We'll handle anti-spam in the Service layer.

    recruiter = relationship("User", foreign_keys=[recruiter_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    subject_talent = relationship("User", foreign_keys=[subject_talent_id])


class SavedTalent(Base):
    __tablename__ = "saved_talents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    talent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('recruiter_id', 'talent_id', name='uq_saved_talent'),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(100), nullable=False, index=True) # e.g. "Conversation", "RecruitmentRequest"
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    action = Column(String(100), nullable=False) # e.g. "CREATED", "UPDATED", "STATUS_CHANGED"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True) # named metadata_json to avoid conflict with SQLAlchemy metadata
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
