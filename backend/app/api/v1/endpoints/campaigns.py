import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.api.dependencies import get_current_user, get_optional_current_user
from app.models.user import User, UserRole
from app.models.campaign import Campaign, CampaignStatus
from app.models.parent_child import ParentChildLink, LinkStatus
from app.repositories.campaign_repository import CampaignRepository
from app.services.campaign_service import CampaignService
from app.services.payment import get_payment_provider
from app.core.rate_limit import rate_limit

router = APIRouter()
logger = logging.getLogger(__name__)

def _campaign_to_card(c: Campaign) -> dict:
    target = float(c.target_amount) if c.target_amount else 1
    current = float(c.current_amount) if c.current_amount else 0
    return {
        'id': str(c.id), 'title': c.title, 'category': c.category,
        'location': c.location, 'target_amount': float(c.target_amount),
        'current_amount': current, 'completion_percentage': round(current / target * 100, 2),
        'currency': c.currency, 'status': c.status, 'visibility': c.visibility,
        'donors_count': c.donors_count, 'views_count': c.views_count,
        'end_date': c.end_date.isoformat() if c.end_date else None,
        'cover_image': c.cover_image, 'created_at': c.created_at.isoformat() if c.created_at else None,
    }

def _campaign_to_detail(c: Campaign) -> dict:
    d = _campaign_to_card(c)
    d.update({
        'description': c.description, 'video_pitch': c.video_pitch,
        'shares_count': c.shares_count, 'favorites_count': c.favorites_count,
        'comments_count': c.comments_count, 'start_date': c.start_date.isoformat() if c.start_date else None,
        'published_at': c.published_at.isoformat() if c.published_at else None,
        'creator_id': str(c.creator_id),
    })
    return d

# ─── Explore (PUBLIC) ───────────────────────────────────────────────────────
@router.get('/explore')
def explore_campaigns(
    title: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    ending_before: Optional[datetime] = Query(None),
    ending_after: Optional[datetime] = Query(None),
    sort: str = Query('recent'),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    repo = CampaignRepository(db)
    items, total = repo.get_public_campaigns(
        title=title, category=category, location=location,
        min_amount=min_amount, max_amount=max_amount,
        ending_before=ending_before, ending_after=ending_after,
        sort=sort, page=page, page_size=page_size
    )
    return {'total': total, 'page': page, 'page_size': page_size, 'items': [_campaign_to_card(c) for c in items]}

# ─── Mes campagnes (AUTH) ────────────────────────────────────────────────────
@router.get('/mine')
def my_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    items, total = repo.get_mine(current_user.id, page=page, page_size=page_size)
    return {'total': total, 'page': page, 'items': [_campaign_to_detail(c) for c in items]}

# ─── Créer ──────────────────────────────────────────────────────────────────
@router.post('/')
def create_campaign(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = CampaignService(db)
    return service.create_campaign(current_user, data)

# ─── Rejoindre via code (PUBLIC) ────────────────────────────────────────────
@router.get('/join/{code}')
def get_campaign_by_code(code: str, db: Session = Depends(get_db)):
    repo = CampaignRepository(db)
    campaign = repo.get_by_invite_code(code.upper())
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable ou code invalide.')
    return _campaign_to_detail(campaign)

@router.post('/join/{code}')
def join_campaign_by_code(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = CampaignRepository(db)
    campaign = repo.get_by_invite_code(code.upper())
    if not campaign:
        raise HTTPException(status_code=404, detail='Code invalide.')
    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Cette campagne n'est plus active.")
    return {'message': 'Vous avez rejoint la campagne.', 'campaign': _campaign_to_detail(campaign)}

# ─── Détail ──────────────────────────────────────────────────────────────────
@router.get('/{campaign_id}')
def get_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')

    is_creator = current_user and str(campaign.creator_id) == str(current_user.id)
    is_admin = current_user and current_user.role in [UserRole.ADMIN, UserRole.MODERATOR]

    # Règles de visibilité par statut
    if campaign.status in [CampaignStatus.DRAFT, CampaignStatus.PENDING_REVIEW, CampaignStatus.PAUSED]:
        if not (is_creator or is_admin):
            raise HTTPException(status_code=403, detail='Accès non autorisé.')
    elif campaign.status in [CampaignStatus.CANCELLED, CampaignStatus.UNDER_INVESTIGATION]:
        if not is_admin:
            raise HTTPException(status_code=404, detail='Campagne introuvable.')

    # Visibilité PRIVATE/UNLISTED
    if campaign.visibility == 'PRIVATE' and not is_creator and not is_admin:
        raise HTTPException(status_code=403, detail="Cette campagne est privée. Utilisez un lien d'invitation.")

    # Incrémenter vues (pas pour le créateur)
    if not is_creator:
        repo.increment_views(campaign_id)

    return _campaign_to_detail(campaign)

# ─── Statistiques (créateur + parent + admin) ────────────────────────────────
@router.get('/{campaign_id}/statistics')
def get_statistics(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')

    is_creator = str(campaign.creator_id) == str(current_user.id)
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.MODERATOR]
    is_parent = False
    if current_user.role == UserRole.PARENT:
        link = db.query(ParentChildLink).filter(
            ParentChildLink.parent_id == current_user.id,
            ParentChildLink.child_id == campaign.creator_id,
            ParentChildLink.status == LinkStatus.ACTIVE
        ).first()
        is_parent = link is not None

    if not (is_creator or is_admin or is_parent):
        raise HTTPException(status_code=403, detail='Accès non autorisé aux statistiques.')

    return repo.get_statistics(campaign_id)

# ─── Donateurs (créateur + parent + admin) ───────────────────────────────────
@router.get('/{campaign_id}/donors')
def get_donors(
    campaign_id: UUID,
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')

    is_creator = str(campaign.creator_id) == str(current_user.id)
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.MODERATOR]
    if not (is_creator or is_admin):
        raise HTTPException(status_code=403, detail='Accès non autorisé.')

    items, total = repo.get_donors(campaign_id, page=page)
    donors = []
    for d in items:
        donors.append({
            'donor_display_name': 'Anonyme' if d.anonymous else str(d.donor_id),
            'amount': float(d.amount),
            'currency': d.currency,
            'created_at': d.created_at.isoformat() if d.created_at else None,
            'message': d.message if not d.anonymous else None,
        })
    return {'total': total, 'page': page, 'items': donors}

# ─── Lien d'invitation (créateur uniquement) ─────────────────────────────────
@router.get('/{campaign_id}/invite-link')
def get_invite_link(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    if not campaign.invite_code:
        code = repo.generate_invite_code(campaign)
    else:
        code = campaign.invite_code
    return {'invite_code': code, 'invite_url': f'/campaigns/join/{code}'}

# ─── Modifier (créateur, DRAFT ou REJECTED seulement) ───────────────────────
@router.put('/{campaign_id}')
def update_campaign(
    campaign_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.REJECTED]:
        raise HTTPException(status_code=400, detail='Seulement modifiable en statut DRAFT ou REJECTED.')

    # Champs protégés - on les retire silencieusement
    protected = ['current_amount', 'donors_count', 'views_count', 'shares_count',
                 'favorites_count', 'comments_count', 'beneficiary_id', 'invite_code',
                 'created_at', 'creator_id', 'status', 'is_deleted']
    for f in protected:
        data.pop(f, None)

    for key, value in data.items():
        if hasattr(campaign, key):
            setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)
    return _campaign_to_detail(campaign)

# ─── Soft Delete ─────────────────────────────────────────────────────────────
@router.delete('/{campaign_id}')
def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    repo.soft_delete(campaign, current_user.id)
    return {'message': 'Campagne supprimée.'}

# ─── Publier (→ PENDING_REVIEW) ──────────────────────────────────────────────
@router.post('/{campaign_id}/publish')
def publish_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.REJECTED]:
        raise HTTPException(status_code=400, detail='Seulement publiable depuis DRAFT ou REJECTED.')

    # Générer invite_code si PRIVATE ou UNLISTED
    if campaign.visibility in ['PRIVATE', 'UNLISTED'] and not campaign.invite_code:
        repo.generate_invite_code(campaign)

    result = repo.publish(campaign)
    return _campaign_to_detail(result)

# ─── Pause ───────────────────────────────────────────────────────────────────
@router.post('/{campaign_id}/pause')
def pause_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(status_code=400, detail='Seulement pausable si ACTIVE.')
    return _campaign_to_detail(repo.pause(campaign))

# ─── Annuler ─────────────────────────────────────────────────────────────────
@router.post('/{campaign_id}/cancel')
def cancel_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    if campaign.status in [CampaignStatus.COMPLETED, CampaignStatus.EXPIRED]:
        raise HTTPException(status_code=400, detail="Impossible d'annuler une campagne terminée.")
    return _campaign_to_detail(repo.cancel(campaign))

# ─── Régénérer lien (5/jour) ─────────────────────────────────────────────────
@router.post('/{campaign_id}/regenerate-link')
def regenerate_invite_link(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign or str(campaign.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail='Non autorisé.')
    code = repo.generate_invite_code(campaign)
    return {'invite_code': code, 'invite_url': f'/campaigns/join/{code}'}

# ─── Favori (60/min) ─────────────────────────────────────────────────────────
@router.post('/{campaign_id}/favorite')
def toggle_favorite(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')
    is_favorited = repo.toggle_favorite(campaign_id, current_user.id)
    return {'favorited': is_favorited, 'favorites_count': repo.get_by_id(campaign_id).favorites_count}

# ─── Commentaire (30/min) ────────────────────────────────────────────────────
@router.post('/{campaign_id}/comment')
def add_comment(
    campaign_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = data.get('content', '').strip()
    if not content or len(content) < 2:
        raise HTTPException(status_code=400, detail='Commentaire trop court.')
    if len(content) > 1000:
        raise HTTPException(status_code=400, detail='Commentaire trop long (max 1000 caractères).')

    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')
    if campaign.status not in [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail='Impossible de commenter cette campagne.')

    parent_id = data.get('parent_comment_id')
    if parent_id:
        parent_id = UUID(parent_id)
    comment = repo.add_comment(campaign_id, current_user.id, content, parent_id)
    return {
        'id': str(comment.id),
        'author_name': current_user.email.split('@')[0] if hasattr(current_user, 'email') else str(current_user.id),
        'content': comment.content,
        'parent_comment_id': str(comment.parent_comment_id) if comment.parent_comment_id else None,
        'created_at': comment.created_at.isoformat() if comment.created_at else None,
    }

# ─── Commentaires (lecture) ──────────────────────────────────────────────────
@router.get('/{campaign_id}/comments')
def get_comments(
    campaign_id: UUID,
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    repo = CampaignRepository(db)
    items, total = repo.get_comments(campaign_id, page=page)
    result = []
    for c in items:
        replies = repo.db.query(__import__('app.models.campaign_social', fromlist=['CampaignComment']).CampaignComment).filter(
            __import__('app.models.campaign_social', fromlist=['CampaignComment']).CampaignComment.parent_comment_id == c.id,
            __import__('app.models.campaign_social', fromlist=['CampaignComment']).CampaignComment.deleted_at == None
        ).all()
        result.append({
            'id': str(c.id), 'content': c.content,
            'created_at': c.created_at.isoformat() if c.created_at else None,
            'replies': [{'id': str(r.id), 'content': r.content, 'created_at': r.created_at.isoformat() if r.created_at else None} for r in replies]
        })
    return {'total': total, 'page': page, 'items': result}

# ─── Signalement (10/h) ──────────────────────────────────────────────────────
@router.post('/{campaign_id}/report')
def report_campaign(
    campaign_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reason = data.get('reason', '').strip()
    if not reason:
        raise HTTPException(status_code=400, detail='Raison requise.')
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')
    report = repo.add_report(campaign_id, current_user.id, reason, data.get('description'))
    return {'message': 'Signalement enregistré.', 'report_id': str(report.id)}

# ─── Don (déjà existant, amélioré) ──────────────────────────────────────────
@router.post('/{campaign_id}/donate')
def donate(
    campaign_id: UUID,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    amount = data.get('amount')
    currency = data.get('currency', 'TND')
    if not amount or float(amount) <= 0:
        raise HTTPException(status_code=400, detail='Montant invalide.')
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail='Campagne introuvable.')
    if campaign.status != CampaignStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Cette campagne n'accepte pas de dons.")
    provider = get_payment_provider()
    metadata = {
        'campaign_id': str(campaign.id),
        'donor_id': str(current_user.id),
        'campaign_title': campaign.title
    }
    intent_data = provider.create_payment_intent(amount=float(amount), currency=currency, metadata=metadata)
    return intent_data
