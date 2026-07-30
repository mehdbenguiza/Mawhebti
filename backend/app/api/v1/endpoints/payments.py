import logging
import json
import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user, get_optional_current_user
from app.models.user import User, UserRole
from app.models.financial import (
    Wallet, WalletTransaction, Donation, PaymentIntent, PaymentIntentStatus,
    PaymentStatus, DonationReceipt
)
from app.services.payment import get_payment_provider
from app.services.wallet_service import wallet_service
from app.services.ledger_service import ledger_service
from app.services.idempotency_service import idempotency_service
from app.services.platform_fee_service import platform_fee_service
from app.services.receipt_service import receipt_service
from app.services.refund_service import refund_service
from app.services.fraud_detection_service import fraud_detection_service
from app.models.campaign import Campaign, CampaignStatus

router = APIRouter()
logger = logging.getLogger(__name__)

# ─── Webhook (public - pas d'auth) ──────────────────────────────────────────
@router.post('/webhook')
async def handle_webhook(
    request: Request,
    provider_name: str = Query(default=None),
    db: Session = Depends(get_db)
):
    payload = await request.body()
    signature = request.headers.get('X-Signature', request.headers.get('Stripe-Signature', ''))
    import os
    name = provider_name or os.getenv('PAYMENT_PROVIDER', 'mock')
    provider = get_payment_provider(name)
    
    if not provider.verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=403, detail='Signature webhook invalide.')
    
    event = provider.parse_webhook_event(payload, signature)
    provider_reference = event.get('provider_reference', '')
    
    if idempotency_service.is_already_processed(provider_reference, db):
        logger.info(f"[Webhook] Événement {provider_reference} déjà traité — ignoré")
        return {'status': 'already_processed'}
    
    idempotency_service.mark_as_processed(
        provider_reference, name, event.get('type', ''), event, db
    )
    
    if event['type'] == 'payment.success':
        await _process_payment_success(event, db)
    elif event['type'] == 'payment.failed':
        await _process_payment_failed(event, db)
    
    db.commit()
    return {'status': 'ok', 'type': event.get('type')}

async def _process_payment_success(event: dict, db: Session):
    provider_payment_id = event.get('provider_payment_id', '')
    intent = db.query(PaymentIntent).filter(
        PaymentIntent.provider_payment_id == provider_payment_id
    ).first()
    if not intent:
        logger.warning(f"[Webhook] PaymentIntent introuvable: {provider_payment_id}")
        return
    
    # Récupérer la donation liée
    donation = db.query(Donation).filter(
        Donation.payment_intent_id == intent.id
    ).first()
    if not donation:
        logger.warning(f"[Webhook] Donation introuvable pour intent {intent.id}")
        return
    
    if donation.payment_status == PaymentStatus.SUCCESS:
        logger.info(f"[Webhook] Donation {donation.id} déjà SUCCESS — ignorée")
        return
    
    # Calcul commission
    gross = Decimal(str(event.get('amount', float(donation.amount))))
    fees = platform_fee_service.calculate(gross)
    net = Decimal(str(fees['net']))
    fee = Decimal(str(fees['fee']))
    
    # Wallet du talent
    campaign = db.query(Campaign).filter(Campaign.id == donation.campaign_id).first()
    if not campaign:
        return
    
    talent_wallet = wallet_service.get_or_create_wallet(campaign.creator_id, db)
    wallet_service.credit(
        talent_wallet, net,
        f"DON-{donation.id}",
        f"Don campagne {campaign.title[:50]} (net après commission 5%)",
        db
    )
    
    # Ledger
    ledger_service.record_donation(
        donation, talent_wallet.id, gross, fee, net,
        event.get('provider_reference', str(uuid.uuid4())), db
    )
    
    # Mettre à jour donation
    donation.payment_status = PaymentStatus.SUCCESS
    donation.net_amount = net
    donation.platform_fee = fee
    
    # Mettre à jour intent
    intent.status = PaymentIntentStatus.SUCCEEDED
    
    # Mettre à jour campagne
    campaign.current_amount += gross
    campaign.donors_count = (campaign.donors_count or 0) + 1
    campaign.last_donation_at = __import__('datetime').datetime.now(__import__('datetime').timezone.utc)
    
    # Générer reçu
    receipt_service.generate(donation, db)
    
    logger.info(f"✅ [Webhook] Paiement SUCCESS: {gross} TND → campagne {campaign.title}")

async def _process_payment_failed(event: dict, db: Session):
    provider_payment_id = event.get('provider_payment_id', '')
    intent = db.query(PaymentIntent).filter(
        PaymentIntent.provider_payment_id == provider_payment_id
    ).first()
    if intent:
        intent.status = PaymentIntentStatus.FAILED
        donation = db.query(Donation).filter(Donation.payment_intent_id == intent.id).first()
        if donation:
            donation.payment_status = PaymentStatus.FAILED
    logger.info(f"❌ [Webhook] Paiement échoué: {provider_payment_id}")

# ─── Mock Checkout (dev uniquement) ─────────────────────────────────────────
@router.get('/mock/checkout/{payment_id}')
async def mock_checkout_page(payment_id: str, amount: float = 0, currency: str = 'TND', campaign: str = ''):
    """Page de paiement simulé — dev uniquement."""
    from fastapi.responses import HTMLResponse
    html = f"""
    <!DOCTYPE html><html>
    <head><title>Paiement Mock — Mawhebti</title>
    <style>body{{font-family:sans-serif;background:#0a0a0f;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}}
    .card{{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px;max-width:400px;text-align:center}}
    h1{{margin-bottom:8px}}p{{color:#9ca3af;margin-bottom:24px}}
    .amount{{font-size:2em;font-weight:900;color:#a78bfa;margin-bottom:24px}}
    button{{padding:16px 40px;border:none;border-radius:12px;font-size:1em;font-weight:bold;cursor:pointer;margin:8px;width:100%}}
    .success{{background:linear-gradient(135deg,#7c3aed,#2563eb);color:white}}
    .fail{{background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.3)}}
    </style></head>
    <body><div class="card">
    <h1>💳 Paiement de test</h1>
    <p>Environnement de développement — MockProvider</p>
    <div class="amount">{amount} {currency}</div>
    <p style="color:#6b7280;font-size:0.85em">Référence: {payment_id}</p>
    <form method="post" action="/api/v1/payments/mock/confirm">
        <input type="hidden" name="payment_id" value="{payment_id}">
        <input type="hidden" name="amount" value="{amount}">
        <input type="hidden" name="currency" value="{currency}">
        <button type="submit" name="result" value="success" class="success">✅ Confirmer le paiement</button>
        <button type="submit" name="result" value="fail" class="fail">❌ Simuler un échec</button>
    </form>
    </div></body></html>
    """
    return HTMLResponse(html)

@router.post('/mock/confirm')
async def mock_checkout_confirm(
    request: Request,
    db: Session = Depends(get_db)
):
    """Confirme ou échoue un paiement mock — déclenche le webhook en interne."""
    from fastapi.responses import RedirectResponse
    form = await request.form()
    payment_id = form.get('payment_id', '')
    result = form.get('result', 'success')
    amount = float(form.get('amount', 0))
    currency = form.get('currency', 'TND')
    
    event_id = f"mock_evt_{__import__('uuid').uuid4().hex[:12]}"
    event_type = 'payment.success' if result == 'success' else 'payment.failed'
    
    event = {
        'type': event_type,
        'provider_reference': event_id,
        'provider_payment_id': payment_id,
        'amount': amount,
        'currency': currency,
        'metadata': {},
    }
    
    if idempotency_service.is_already_processed(event_id, db):
        pass
    else:
        idempotency_service.mark_as_processed(event_id, 'mock', event_type, event, db)
        if result == 'success':
            await _process_payment_success(event, db)
        else:
            await _process_payment_failed(event, db)
        db.commit()
    
    # Trouver la campagne pour rediriger
    intent = db.query(PaymentIntent).filter(PaymentIntent.provider_payment_id == payment_id).first()
    if intent:
        return RedirectResponse(f"/campaigns/{intent.campaign_id}?payment={result}", status_code=303)
    return RedirectResponse("/campaigns/explore", status_code=303)

# ─── Mon Wallet ──────────────────────────────────────────────────────────────
@router.get('/wallet')
def get_my_wallet(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = wallet_service.get_or_create_wallet(current_user.id, db)
    db.commit()
    txns = db.query(WalletTransaction).filter(
        WalletTransaction.wallet_id == wallet.id
    ).order_by(WalletTransaction.created_at.desc()).limit(50).all()
    return {
        **wallet_service.get_balance(wallet),
        'wallet_id': str(wallet.id),
        'status': wallet.status,
        'transactions': [
            {
                'id': str(t.id),
                'type': t.transaction_type,
                'amount': float(t.amount),
                'balance_before': float(t.balance_before),
                'balance_after': float(t.balance_after),
                'reference': t.reference,
                'description': t.description,
                'created_at': t.created_at.isoformat() if t.created_at else None,
            } for t in txns
        ]
    }

# ─── Mes Dons effectués ──────────────────────────────────────────────────────
@router.get('/my-donations')
def get_my_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Donation).filter(Donation.donor_id == current_user.id)
    total = q.count()
    donations = q.order_by(Donation.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    total_given = sum(float(d.amount) for d in db.query(Donation).filter(
        Donation.donor_id == current_user.id,
        Donation.payment_status == PaymentStatus.SUCCESS
    ).all())
    return {
        'total': total,
        'page': page,
        'total_given_tnd': total_given,
        'items': [
            {
                'id': str(d.id),
                'campaign_id': str(d.campaign_id),
                'amount': float(d.amount),
                'currency': d.currency,
                'status': d.payment_status,
                'anonymous': d.anonymous,
                'message': d.message,
                'created_at': d.created_at.isoformat() if d.created_at else None,
            } for d in donations
        ]
    }

# ─── Reçus ───────────────────────────────────────────────────────────────────
@router.get('/receipts')
def get_my_receipts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    donations = db.query(Donation).filter(
        Donation.donor_id == current_user.id,
        Donation.payment_status == PaymentStatus.SUCCESS
    ).all()
    donation_ids = [d.id for d in donations]
    receipts = db.query(DonationReceipt).filter(
        DonationReceipt.donation_id.in_(donation_ids)
    ).order_by(DonationReceipt.generated_at.desc()).all()
    return {
        'items': [
            {
                'id': str(r.id),
                'donation_id': str(r.donation_id),
                'receipt_number': r.receipt_number,
                'generated_at': r.generated_at.isoformat() if r.generated_at else None,
            } for r in receipts
        ]
    }

# ─── Retrait ─────────────────────────────────────────────────────────────────
@router.post('/wallet/withdraw')
def request_withdrawal(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.financial import Withdrawal
    amount = Decimal(str(data.get('amount', 0)))
    if amount < Decimal('10'):
        raise HTTPException(400, 'Montant minimum de retrait : 10 TND')
    wallet = wallet_service.get_or_create_wallet(current_user.id, db)
    if wallet.available_balance < amount:
        raise HTTPException(400, f'Solde insuffisant. Disponible: {wallet.available_balance} TND')
    
    withdrawal = Withdrawal(
        wallet_id=wallet.id,
        beneficiary_id=current_user.id,
        amount=amount,
        currency='TND',
        status='REQUESTED',
        reason=data.get('reason', 'Retrait demandé'),
    )
    db.add(withdrawal)
    # Bloquer les fonds
    wallet_service.debit(wallet, amount, f"WITHDRAW-PENDING-{withdrawal.id}", "Retrait en attente de validation", db)
    db.commit()
    return {'status': 'REQUESTED', 'withdrawal_id': str(withdrawal.id), 'amount': float(amount)}

@router.get('/wallet/withdrawals')
def get_withdrawals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.financial import Withdrawal
    withdrawals = db.query(Withdrawal).filter(
        Withdrawal.beneficiary_id == current_user.id
    ).order_by(Withdrawal.requested_at.desc()).all()
    return {'items': [
        {'id': str(w.id), 'amount': float(w.amount), 'currency': w.currency or 'TND',
         'status': w.status, 'requested_at': w.requested_at.isoformat() if w.requested_at else None,
         'processed_at': w.processed_at.isoformat() if w.processed_at else None}
        for w in withdrawals
    ]}

# ─── Admin ───────────────────────────────────────────────────────────────────
@router.get('/admin/stats')
def finance_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(403, 'Réservé aux administrateurs.')
    
    from sqlalchemy import func as sqlfunc
    total_donations = db.query(sqlfunc.sum(Donation.amount)).filter(
        Donation.payment_status == PaymentStatus.SUCCESS
    ).scalar() or 0
    total_fees = db.query(sqlfunc.sum(Donation.platform_fee)).filter(
        Donation.payment_status == PaymentStatus.SUCCESS
    ).scalar() or 0
    count_donations = db.query(Donation).filter(Donation.payment_status == PaymentStatus.SUCCESS).count()
    count_failed = db.query(Donation).filter(Donation.payment_status == PaymentStatus.FAILED).count()
    count_refunded = db.query(Donation).filter(Donation.payment_status == PaymentStatus.REFUNDED).count()
    
    from app.models.financial import Withdrawal
    pending_withdrawals = db.query(Withdrawal).filter(Withdrawal.status == 'REQUESTED').count()
    
    total_wallets = db.query(Wallet).count()
    total_balance = db.query(sqlfunc.sum(Wallet.available_balance)).scalar() or 0
    
    return {
        'total_donations_tnd': float(total_donations),
        'total_platform_fees_tnd': float(total_fees),
        'count_donations_success': count_donations,
        'count_donations_failed': count_failed,
        'count_refunded': count_refunded,
        'pending_withdrawals': pending_withdrawals,
        'total_wallets': total_wallets,
        'total_wallet_balance_tnd': float(total_balance),
        'currency': 'TND',
    }

@router.post('/admin/donations/{donation_id}/refund')
def admin_refund(
    donation_id: UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(403, 'Réservé aux administrateurs.')
    reason = data.get('reason', 'Remboursement admin')
    result = refund_service.process_refund(donation_id, current_user.id, reason, db)
    db.commit()
    return result

@router.post('/admin/withdrawals/{withdrawal_id}/approve')
def admin_approve_withdrawal(
    withdrawal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.financial import Withdrawal
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(403, 'Réservé aux administrateurs.')
    withdrawal = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not withdrawal:
        raise HTTPException(404, 'Retrait introuvable.')
    withdrawal.status = 'APPROVED'
    import datetime
    withdrawal.processed_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    return {'status': 'APPROVED', 'withdrawal_id': str(withdrawal_id)}
