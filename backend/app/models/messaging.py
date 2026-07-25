import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func, Integer, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class RecruitmentStage(str, enum.Enum):
    NEW_CONTACT = "NEW_CONTACT"
    FIRST_EXCHANGE = "FIRST_EXCHANGE"
    INTERVIEW = "INTERVIEW"
    SECOND_INTERVIEW = "SECOND_INTERVIEW"
    OFFER = "OFFER"
    NEGOTIATION = "NEGOTIATION"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class ConversationStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"
    BLOCKED = "BLOCKED"

class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    PDF = "PDF"
    DOCUMENT = "DOCUMENT"
    SYSTEM = "SYSTEM"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_talent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(ConversationStatus), nullable=False, default=ConversationStatus.OPEN)
    recruitment_stage = Column(Enum(RecruitmentStage), nullable=False, default=RecruitmentStage.NEW_CONTACT)
    risk_score = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class ConversationParticipantRole(str, enum.Enum):
    RECRUITER = "RECRUITER"
    TALENT = "TALENT"
    PARENT = "PARENT"
    MODERATOR = "MODERATOR"

class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(Enum(ConversationParticipantRole), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.TEXT)
    content = Column(Text, nullable=True) # Text content or file URL
    
    is_read = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="SENT") # SENT, DELIVERED, READ, BLOCKED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")


class BlockedUser(Base):
    __tablename__ = "blocked_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blocked_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_user = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NotificationPriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"

class NotificationType(str, enum.Enum):
    VIDEO_LIKED = "VIDEO_LIKED"
    VIDEO_COMMENTED = "VIDEO_COMMENTED"
    VIDEO_APPROVED = "VIDEO_APPROVED"
    VIDEO_REJECTED = "VIDEO_REJECTED"
    NEW_MESSAGE = "NEW_MESSAGE"
    MESSAGE_BLOCKED = "MESSAGE_BLOCKED"
    RECRUITMENT_REQUEST = "RECRUITMENT_REQUEST"
    RECRUITMENT_ACCEPTED = "RECRUITMENT_ACCEPTED"
    RECRUITMENT_REJECTED = "RECRUITMENT_REJECTED"
    RECRUITMENT_STAGE_CHANGED = "RECRUITMENT_STAGE_CHANGED"
    TALENT_SAVED = "TALENT_SAVED"
    DONATION_RECEIVED = "DONATION_RECEIVED"
    CAMPAIGN_COMPLETED = "CAMPAIGN_COMPLETED"
    CAMPAIGN_EXPIRED = "CAMPAIGN_EXPIRED"
    PROFILE_VERIFIED = "PROFILE_VERIFIED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    SECURITY_ALERT = "SECURITY_ALERT"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    LOGIN_NEW_DEVICE = "LOGIN_NEW_DEVICE"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(Enum(NotificationType, native_enum=False, length=100), nullable=False)
    priority = Column(Enum(NotificationPriority, native_enum=False, length=50), nullable=False, default=NotificationPriority.NORMAL)
    
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    link = Column(String(512), nullable=True)
    
    is_seen = Column(Boolean, default=False, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    recipient = relationship("User")


class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    likes_enabled = Column(Boolean, default=True, nullable=False)
    messages_enabled = Column(Boolean, default=True, nullable=False)
    recruitment_enabled = Column(Boolean, default=True, nullable=False)
    crowdfunding_enabled = Column(Boolean, default=True, nullable=False)
    emails_enabled = Column(Boolean, default=True, nullable=False)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
