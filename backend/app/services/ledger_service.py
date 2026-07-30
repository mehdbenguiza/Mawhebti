import uuid
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.financial import FinancialTransaction, TransactionDirection, TransactionReason
import logging
logger = logging.getLogger(__name__)

class FinancialLedgerService:
    def record_donation(self, donation, wallet_id, gross: Decimal, fee: Decimal, net: Decimal, provider_reference: str, db: Session) -> FinancialTransaction:
        txn = FinancialTransaction(
            donation_id=donation.id,
            amount=net,
            gross_amount=gross,
            platform_fee=fee,
            provider_fee=Decimal('0'),
            fee=fee,
            net_amount=net,
            wallet_id=wallet_id,
            transaction_direction=TransactionDirection.INCOMING,
            transaction_reason=TransactionReason.DONATION,
            provider=donation.payment_method or 'mock',
            provider_reference=provider_reference,
            status='SUCCESS',
        )
        db.add(txn)
        db.flush()
        logger.info(f"[Ledger] Donation {donation.id} enregistrée: {gross} TND → {net} TND net")
        return txn
    
    def record_withdrawal(self, wallet_id, amount: Decimal, reference: str, db: Session) -> FinancialTransaction:
        txn = FinancialTransaction(
            amount=amount,
            gross_amount=amount,
            platform_fee=Decimal('0'),
            provider_fee=Decimal('0'),
            fee=Decimal('0'),
            net_amount=amount,
            wallet_id=wallet_id,
            transaction_direction=TransactionDirection.OUTGOING,
            transaction_reason=TransactionReason.WITHDRAWAL,
            provider='bank_transfer',
            provider_reference=reference,
            status='PENDING',
        )
        db.add(txn)
        db.flush()
        return txn

ledger_service = FinancialLedgerService()
