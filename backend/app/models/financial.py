import uuid
import enum
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func, JSON, Integer, Numeric, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaymentIntentStatus(str, enum.Enum):
    CREATED = "CREATED"
    REQUIRES_PAYMENT = "REQUIRES_PAYMENT"
    PROCESSING = "PROCESSING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"

class TransactionDirection(str, enum.Enum):
    INCOMING = "INCOMING"
    OUTGOING = "OUTGOING"

class TransactionReason(str, enum.Enum):
    DONATION = "DONATION"
    PLATFORM_FEE = "PLATFORM_FEE"
    REFUND = "REFUND"
    WITHDRAWAL = "WITHDRAWAL"
    ADJUSTMENT = "ADJUSTMENT"

class FraudDecision(str, enum.Enum):
    CLEAN = "CLEAN"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"

class PaymentIntent(Base):
    __tablename__ = "payment_intents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    provider = Column(String(50), nullable=False) # e.g. STRIPE
    provider_payment_id = Column(String(255), nullable=False, unique=True, index=True)
    checkout_url = Column(String(1024), nullable=True)
    
    status = Column(Enum(PaymentIntentStatus, native_enum=False, length=50), nullable=False, default=PaymentIntentStatus.CREATED)
    
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Donation(Base):
    __tablename__ = "donations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), nullable=False)
    
    anonymous = Column(Boolean, default=False)
    message = Column(Text, nullable=True)
    
    payment_method = Column(String(100), nullable=True)
    payment_status = Column(Enum(PaymentStatus, native_enum=False, length=50), nullable=False, default=PaymentStatus.PENDING)
    
    transaction_reference = Column(String(255), nullable=True, unique=True)
    platform_fee = Column(Numeric(12, 2), nullable=False, default=0.00)
    net_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint('amount > 0', name='check_donation_amount_positive'),
    )

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    fee = Column(Numeric(12, 2), nullable=False, default=0.00)
    net_amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    
    transaction_direction = Column(Enum(TransactionDirection, native_enum=False, length=50), nullable=False)
    transaction_reason = Column(Enum(TransactionReason, native_enum=False, length=50), nullable=False)
    
    provider = Column(String(50), nullable=False)
    provider_reference = Column(String(255), nullable=False, unique=True, index=True)
    
    status = Column(String(50), nullable=False) # e.g. SUCCESS
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    beneficiary_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), nullable=False, default="REQUESTED")
    
    provider_reference = Column(String(255), nullable=True)
    
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

class DonationReceipt(Base):
    __tablename__ = "donation_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    receipt_number = Column(String(255), nullable=False, unique=True)
    pdf_url = Column(String(1024), nullable=True)
    
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

class FraudCheck(Base):
    __tablename__ = "fraud_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE"), nullable=False)
    
    risk_score = Column(Integer, nullable=False, default=0)
    decision = Column(Enum(FraudDecision, native_enum=False, length=50), nullable=False, default=FraudDecision.CLEAN)
    reasons = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
