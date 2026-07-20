from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID

from app.core.database import get_db
from app.services.contact_service import ContactService
from app.services.conversation_service import ConversationService

router = APIRouter()

@router.post("/requests")
def create_recruitment_request(subject_talent_id: UUID, message: str, db: Session = Depends(get_db)):
    """
    Crée une nouvelle demande de contact (Zero Trust Routing).
    """
    # TODO: Get recruiter_id from current_user
    # Mock recruiter for MVP
    recruiter_id = subject_talent_id # Temporaire : remplacer par current_user.id
    
    # En MVP sans auth branchée partout, on simule :
    try:
        req = ContactService.create_recruitment_request(db, recruiter_id=recruiter_id, subject_talent_id=subject_talent_id, message=message)
        return {"id": str(req.id), "status": req.status, "message": "Demande de contact envoyée avec succès."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/requests/{request_id}/accept")
def accept_recruitment_request(request_id: UUID, db: Session = Depends(get_db)):
    """
    Accepte une demande et crée la conversation associée.
    """
    try:
        conv = ConversationService.create_conversation_from_request(db, request_id)
        return {"conversation_id": str(conv.id), "message": "Demande acceptée, conversation créée."}
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
