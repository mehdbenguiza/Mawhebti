from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.services.contact_service import ContactService
from app.services.conversation_service import ConversationService
from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus, SavedTalent

router = APIRouter()

@router.post("/requests")
def create_recruitment_request(recruiter_id: UUID, subject_talent_id: UUID, message: str, db: Session = Depends(get_db)):
    """
    Crée une nouvelle demande de contact (Zero Trust Routing).
    """
    if recruiter_id == subject_talent_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous envoyer une demande à vous-même.")
    try:
        req = ContactService.create_recruitment_request(db, recruiter_id=recruiter_id, subject_talent_id=subject_talent_id, message=message)
        return {"id": str(req.id), "status": req.status, "message": "Demande de contact envoyée avec succès."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{request_id}/accept")
def accept_recruitment_request(request_id: UUID, acceptor_id: UUID, db: Session = Depends(get_db)):
    """
    Accepte une demande de contact.
    Seul le destinataire (recipient) peut accepter, jamais l'expéditeur.
    """
    from app.models.user import User

    req = db.query(RecruitmentRequest).filter(RecruitmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")

    if req.status != RecruitmentRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée.")

    # Empêcher l'expéditeur d'accepter sa propre demande
    if req.recruiter_id == acceptor_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas accepter votre propre demande de contact.")

    try:
        conv = ConversationService.create_conversation_from_request(db, request_id)
        return {"conversation_id": str(conv.id), "message": "Demande acceptée, conversation créée."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{request_id}/reject")
def reject_recruitment_request(request_id: UUID, rejector_id: UUID, db: Session = Depends(get_db)):
    """
    Refuse une demande de contact.
    """
    req = db.query(RecruitmentRequest).filter(RecruitmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")

    if req.recruiter_id == rejector_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas refuser votre propre demande.")

    req.status = RecruitmentRequestStatus.REJECTED
    db.commit()
    return {"message": "Demande refusée."}


@router.get("/requests")
def get_recruitment_requests(user_id: UUID, db: Session = Depends(get_db)):
    """
    Retourne les demandes de contact liées à l'utilisateur connecté
    (soit comme destinataire, soit comme recruteur).
    """
    from app.models.user import User
    from app.models.profile import Profile

    requests = db.query(RecruitmentRequest).filter(
        (RecruitmentRequest.recipient_id == user_id) |
        (RecruitmentRequest.recruiter_id == user_id)
    ).order_by(RecruitmentRequest.created_at.desc()).all()

    result = []
    for r in requests:
        recruiter = db.query(User).filter(User.id == r.recruiter_id).first()
        recruiter_profile = db.query(Profile).filter(Profile.user_id == r.recruiter_id).first()
        talent = db.query(User).filter(User.id == r.subject_talent_id).first()
        talent_profile = db.query(Profile).filter(Profile.user_id == r.subject_talent_id).first()

        recruiter_name = f"{recruiter_profile.first_name} {recruiter_profile.last_name}".strip() if recruiter_profile else recruiter.email if recruiter else "Inconnu"
        talent_name = f"{talent_profile.first_name} {talent_profile.last_name}".strip() if talent_profile else talent.email if talent else "Inconnu"

        result.append({
            "id": str(r.id),
            "status": r.status,
            "message": r.message,
            "created_at": r.created_at,
            "i_am_sender": str(r.recruiter_id) == str(user_id),
            "recruiter": {"id": str(r.recruiter_id), "name": recruiter_name},
            "talent": {"id": str(r.subject_talent_id), "name": talent_name},
        })
    return result

@router.post("/saved-talents/{talent_id}/toggle")
def toggle_save_talent(talent_id: UUID, recruiter_id: UUID, db: Session = Depends(get_db)):
    """
    Sauvegarder ou retirer un talent de ses favoris.
    """
    saved = db.query(SavedTalent).filter(SavedTalent.recruiter_id == recruiter_id, SavedTalent.talent_id == talent_id).first()
    
    if saved:
        db.delete(saved)
        db.commit()
        return {"action": "removed"}
    else:
        new_saved = SavedTalent(recruiter_id=recruiter_id, talent_id=talent_id)
        db.add(new_saved)
        db.commit()
        return {"action": "saved"}
