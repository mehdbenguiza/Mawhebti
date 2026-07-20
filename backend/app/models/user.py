import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, func, Integer, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.core.database import Base

class UserRole(str, enum.Enum):
    TALENT_MINOR = "TALENT_MINOR"
    TALENT_MAJOR = "TALENT_MAJOR"
    PARENT = "PARENT"
    RECRUITER = "RECRUITER"
    MODERATOR = "MODERATOR"
    ADMIN = "ADMIN"

class UserStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BLOCKED = "BLOCKED"
    DELETED = "DELETED"

class UserVerificationLevel(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    PHONE_VERIFIED = "PHONE_VERIFIED"
    KYC_VERIFIED = "KYC_VERIFIED"
    BANK_VERIFIED = "BANK_VERIFIED"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(254), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.PENDING)
    is_verified = Column(Boolean, default=False)

    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    version = Column(Integer, default=1, server_default="1")

    # Vérifications et Niveaux de confiance
    phone_number = Column(String(50), nullable=True)
    phone_verified_at = Column(DateTime(timezone=True), nullable=True)
    kyc_verified_at = Column(DateTime(timezone=True), nullable=True)
    bank_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    verification_level = Column(Enum(UserVerificationLevel), nullable=False, default=UserVerificationLevel.UNVERIFIED)

    @property
    def trust_level(self) -> int:
        """
        Niveau 0: Email vérifié (ou inscrit de base)
        Niveau 1: Téléphone vérifié
        Niveau 2: KYC vérifié
        Niveau 3: Banque vérifiée
        """
        if self.bank_verified_at and self.kyc_verified_at:
            return 3
        if self.kyc_verified_at:
            return 2
        if self.phone_verified_at:
            return 1
        return 0

    # Relation one-to-one vers le profil
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
