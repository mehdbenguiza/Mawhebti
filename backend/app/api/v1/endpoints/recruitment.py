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
