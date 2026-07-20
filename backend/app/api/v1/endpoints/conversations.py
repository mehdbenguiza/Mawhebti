from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.messaging import Conversation, Message
from app.services.message_service import MessageService

router = APIRouter()

@router.get("/")
def list_conversations(db: Session = Depends(get_db)):
    """
    Retourne la liste des conversations (mock pour le MVP, sans current_user)
    """
    from app.models.user import User
    
    conversations = db.query(Conversation).all()
    result = []
    for c in conversations:
        talent = db.query(User).filter(User.id == c.subject_talent_id).first()
        result.append({
            "id": str(c.id),
            "status": c.status,
            "recruitment_stage": c.recruitment_stage,
            "risk_score": c.risk_score,
            "talent": {"id": str(talent.id), "name": f"{talent.email}"} if talent else None,
            "created_at": c.created_at
        })
    return result

@router.get("/{conversation_id}/messages")
def list_messages(conversation_id: UUID, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return messages

@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: UUID, content: str, sender_id: UUID, db: Session = Depends(get_db)):
    try:
        msg = await MessageService.send_message(db, conversation_id, sender_id, content)
        return {"id": str(msg.id), "content": msg.content, "status": msg.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
