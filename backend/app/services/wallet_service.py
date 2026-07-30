import uuid
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.financial import Wallet, WalletTransaction, WalletTransactionType, WalletStatus
from fastapi import HTTPException
import logging
logger = logging.getLogger(__name__)

class WalletService:
    def get_or_create_wallet(self, owner_id, db: Session) -> Wallet:
        wallet = db.query(Wallet).filter(Wallet.owner_id == owner_id).first()
        if not wallet:
            wallet = Wallet(owner_id=owner_id, currency='TND')
            db.add(wallet)
            db.flush()
            logger.info(f"[WalletService] Wallet créé pour user {owner_id}")
        return wallet
    
    def credit(self, wallet: Wallet, amount: Decimal, reference: str, description: str, db: Session) -> WalletTransaction:
        if wallet.status != WalletStatus.ACTIVE:
            raise HTTPException(400, f"Wallet {wallet.id} n'est pas actif (statut: {wallet.status})")
        balance_before = wallet.available_balance
        wallet.available_balance += amount
        wallet.total_received += amount
        txn = WalletTransaction(
            wallet_id=wallet.id,
            transaction_type=WalletTransactionType.CREDIT,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.available_balance,
            reference=reference,
            description=description,
        )
        db.add(txn)
        db.flush()
        logger.info(f"[WalletService] CREDIT {amount} TND → wallet {wallet.id} (ref: {reference})")
        return txn
    
    def debit(self, wallet: Wallet, amount: Decimal, reference: str, description: str, db: Session) -> WalletTransaction:
        if wallet.status != WalletStatus.ACTIVE:
            raise HTTPException(400, "Wallet non actif")
        if wallet.available_balance < amount:
            raise HTTPException(400, f"Solde insuffisant. Disponible: {wallet.available_balance} TND, demandé: {amount} TND")
        balance_before = wallet.available_balance
        wallet.available_balance -= amount
        wallet.total_withdrawn += amount
        txn = WalletTransaction(
            wallet_id=wallet.id,
            transaction_type=WalletTransactionType.DEBIT,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.available_balance,
            reference=reference,
            description=description,
        )
        db.add(txn)
        db.flush()
        return txn
    
    def get_balance(self, wallet: Wallet) -> dict:
        return {
            'available': float(wallet.available_balance),
            'pending': float(wallet.pending_balance),
            'locked': float(wallet.locked_balance),
            'total_received': float(wallet.total_received),
            'total_withdrawn': float(wallet.total_withdrawn),
            'currency': wallet.currency,
        }

wallet_service = WalletService()
