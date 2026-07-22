"""
Endpoints de recrutement — Architecture Enterprise avec JWT obligatoire.

Toutes les routes utilisent get_current_user (Bearer token).
Le user_id ne provient JAMAIS du frontend — c'est une règle de sécurité non négociable.

Routes:
  GET  /recruitment/dashboard            → Stats agrégées en 1 appel (DashboardService)
  GET  /recruitment/saved-talents        → Liste paginée des favoris
  POST /recruitment/saved-talents/{id}   → Toggle favori (save/unsave)
  POST /recruitment/requests             → Créer une demande de contact
  POST /recruitment/requests/{id}/accept → Accepter une demande
  POST /recruitment/requests/{id}/reject → Refuser une demande
  GET  /recruitment/requests             → Lister ses demandes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus, SavedTalent
from app.models.profile import Profile
from app.services.contact_service import ContactService
from app.services.conversation_service import ConversationService
from app.services.dashboard_service import DashboardService

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_recruiter_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne toutes les métriques du dashboard recruteur en un seul appel.
    Réservé aux recruteurs.
    """
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs.")
    return DashboardService.get_recruiter_dashboard(db, current_user.id)


# ─────────────────────────────────────────────────────────────────────────────
# FAVORIS (SAVED TALENTS)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/saved-talents")
def get_saved_talents(
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne la liste paginée des talents sauvegardés par le recruteur connecté.
    Inclut : avatar, compétence principale, date de sauvegarde.
    """
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs.")
    return DashboardService.get_saved_talents_page(db, current_user.id, page, page_size)


@router.post("/saved-talents/{talent_id}/toggle")
def toggle_save_talent(
    talent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sauvegarde ou retire un talent des favoris du recruteur connecté.
    Retourne {"action": "saved"} ou {"action": "removed"}.
    """
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs.")

    if str(talent_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous sauvegarder vous-même.")

    saved = (
        db.query(SavedTalent)
        .filter(
            SavedTalent.recruiter_id == current_user.id,
            SavedTalent.talent_id == talent_id,
        )
        .first()
    )

    if saved:
        db.delete(saved)
        db.commit()
        return {"action": "removed", "talent_id": str(talent_id)}
    else:
        new_saved = SavedTalent(recruiter_id=current_user.id, talent_id=talent_id)
        db.add(new_saved)
        db.commit()
        return {"action": "saved", "talent_id": str(talent_id)}


# ─────────────────────────────────────────────────────────────────────────────
# DEMANDES DE CONTACT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/requests")
def create_recruitment_request(
    subject_talent_id: UUID,
    message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée une nouvelle demande de contact (Zero Trust Routing)."""
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs.")
    if str(subject_talent_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous envoyer une demande.")
    try:
        req = ContactService.create_recruitment_request(
            db,
            recruiter_id=current_user.id,
            subject_talent_id=subject_talent_id,
            message=message,
        )
        return {
            "id": str(req.id),
            "status": req.status,
            "message": "Demande de contact envoyée avec succès.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{request_id}/accept")
def accept_recruitment_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accepte une demande de contact.
    Seul le destinataire (recipient) peut accepter.
    """
    req = db.query(RecruitmentRequest).filter(RecruitmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
    if req.status != RecruitmentRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée.")
    if req.recruiter_id == current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas accepter votre propre demande.")
    try:
        conv = ConversationService.create_conversation_from_request(db, request_id)
        return {"conversation_id": str(conv.id), "message": "Demande acceptée, conversation créée."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{request_id}/reject")
def reject_recruitment_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Refuse une demande de contact."""
    req = db.query(RecruitmentRequest).filter(RecruitmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
    if req.recruiter_id == current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas refuser votre propre demande.")
    req.status = RecruitmentRequestStatus.REJECTED
    db.commit()
    return {"message": "Demande refusée."}


@router.get("/requests")
def get_recruitment_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les demandes de contact liées à l'utilisateur connecté
    (soit comme destinataire, soit comme expéditeur).
    """
    requests = (
        db.query(RecruitmentRequest)
        .filter(
            (RecruitmentRequest.recipient_id == current_user.id)
            | (RecruitmentRequest.recruiter_id == current_user.id)
        )
        .order_by(RecruitmentRequest.created_at.desc())
        .all()
    )

    result = []
    for r in requests:
        recruiter = db.query(User).filter(User.id == r.recruiter_id).first()
        recruiter_profile = db.query(Profile).filter(Profile.user_id == r.recruiter_id).first()
        talent = db.query(User).filter(User.id == r.subject_talent_id).first()
        talent_profile = db.query(Profile).filter(Profile.user_id == r.subject_talent_id).first()

        recruiter_name = (
            f"{recruiter_profile.first_name} {recruiter_profile.last_name}".strip()
            if recruiter_profile
            else (recruiter.email if recruiter else "Inconnu")
        )
        talent_name = (
            f"{talent_profile.first_name} {talent_profile.last_name}".strip()
            if talent_profile
            else (talent.email if talent else "Inconnu")
        )

        result.append({
            "id": str(r.id),
            "status": r.status,
            "message": r.message,
            "created_at": r.created_at,
            "i_am_sender": str(r.recruiter_id) == str(current_user.id),
            "recruiter": {"id": str(r.recruiter_id), "name": recruiter_name},
            "talent": {"id": str(r.subject_talent_id), "name": talent_name},
        })

    return result
