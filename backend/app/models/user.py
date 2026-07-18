import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, func, Integer
from sqlalchemy.dialects.postgresql import UUID
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

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
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
