from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID

from app.core.database import get_db
from app.services.contact_service import ContactService
from app.services.conversation_service import ConversationService
from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus

router = APIRouter()

@router.post("/requests")
def create_recruitment_request(recruiter_id: UUID, subject_talent_id: UUID, message: str, db: Session = Depends(get_db)):
    """
    Crée une nouvelle demande de contact (Zero Trust Routing).
    recruiter_id : l'UUID du recruteur connecté (à remplacer par current_user.id quand l'auth sera branchée partout)
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
    Accepte une demande et crée la conversation associée.
    acceptor_id : l'UUID du parent/talent qui accepte (ne peut pas être le recruteur qui a envoyé la demande)
    """
    req = db.query(RecruitmentRequest).filter(RecruitmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
    
    # Empêcher l'expéditeur d'accepter sa propre demande
    if req.recruiter_id == acceptor_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas accepter votre propre demande de contact.")
    
    # Vérifier que c'est bien le destinataire qui accepte
    if req.recipient_id != acceptor_id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accepter cette demande.")
    
    try:
        conv = ConversationService.create_conversation_from_request(db, request_id)
        return {"conversation_id": str(conv.id), "message": "Demande acceptée, conversation créée."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/requests")
def get_recruitment_requests(db: Session = Depends(get_db)):
    """
    Retourne la liste des demandes de contact (mock MVP: retourne toutes les demandes)
    """
    from app.models.recruitment import RecruitmentRequest
    from app.models.user import User
    
    requests = db.query(RecruitmentRequest).all()
    # Serialize manually for MVP
    result = []
    for r in requests:
        recruiter = db.query(User).filter(User.id == r.recruiter_id).first()
        talent = db.query(User).filter(User.id == r.subject_talent_id).first()
        result.append({
            "id": str(r.id),
            "status": r.status,
            "message": r.message,
            "created_at": r.created_at,
            "recruiter": {"id": str(recruiter.id), "name": f"{recruiter.email}"} if recruiter else None,
            "talent": {"id": str(talent.id), "name": f"{talent.email}"} if talent else None
        })
    return result
