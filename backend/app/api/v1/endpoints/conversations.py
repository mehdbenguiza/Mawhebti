from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.models.messaging import Conversation, ConversationParticipant, Message
from app.services.message_service import MessageService

router = APIRouter()


@router.get("/")
def list_conversations(user_id: UUID, db: Session = Depends(get_db)):
    """
    Retourne uniquement les conversations où user_id est participant.
    """
    from app.models.user import User
    from app.models.profile import Profile

    # Conversations où l'utilisateur est participant
    participant_conv_ids = db.query(ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == user_id
    ).subquery()

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(participant_conv_ids)
    ).order_by(Conversation.created_at.desc()).all()

    result = []
    for c in conversations:
        talent = db.query(User).filter(User.id == c.subject_talent_id).first()
        talent_profile = db.query(Profile).filter(Profile.user_id == c.subject_talent_id).first() if talent else None
        talent_name = f"{talent_profile.first_name} {talent_profile.last_name}".strip() if talent_profile else talent.email if talent else "Inconnu"

        # Dernier message
        last_msg = db.query(Message).filter(
            Message.conversation_id == c.id
        ).order_by(Message.created_at.desc()).first()

        result.append({
            "id": str(c.id),
            "status": c.status,
            "recruitment_stage": c.recruitment_stage,
            "risk_score": c.risk_score,
            "talent": {"id": str(talent.id), "name": talent_name} if talent else None,
            "last_message": last_msg.content if last_msg else None,
            "created_at": c.created_at,
        })
    return result


@router.get("/{conversation_id}/messages")
def list_messages(conversation_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """
    Retourne les messages d'une conversation, uniquement si l'utilisateur y participe.
    """
    # Vérifier que l'utilisateur est bien participant
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == user_id
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette conversation.")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    return [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "content": m.content,
            "message_type": m.message_type,
            "status": m.status,
            "created_at": m.created_at,
        }
        for m in messages
    ]


@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: UUID, content: str, sender_id: UUID, db: Session = Depends(get_db)):
    """
    Envoie un message dans une conversation (passe par le ModerationService).
    """
    # Vérifier que l'expéditeur est participant
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == sender_id
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette conversation.")

    try:
        msg = await MessageService.send_message(db, conversation_id, sender_id, content)
        return {"id": str(msg.id), "content": msg.content, "status": msg.status, "created_at": msg.created_at}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
