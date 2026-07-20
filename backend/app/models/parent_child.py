import uuid
import enum
from sqlalchemy import Column, ForeignKey, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class LinkStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ParentChildLink(Base):
    __tablename__ = "parent_child_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # L'ID du parent peut être nul au moment de la création si le parent n'est pas encore inscrit
    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    child_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Email du parent fourni par le mineur lors de l'inscription
    parent_email = Column(String(254), nullable=False)
    
    status = Column(Enum(LinkStatus, name="linkstatus", create_type=False), nullable=False, default=LinkStatus.PENDING)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relations directionnelles
    parent = relationship("User", foreign_keys=[parent_id])
    child = relationship("User", foreign_keys=[child_id])
