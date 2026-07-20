from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.messaging import Message, MessageType, Conversation, ConversationStatus
from app.services.moderation_service import ModerationService
from app.services.event_bus import event_bus

class MessageService:
    @staticmethod
    async def send_message(db: Session, conversation_id: UUID, sender_id: UUID, content: str, message_type: MessageType = MessageType.TEXT) -> Message:
        # 1. Check conversation
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation introuvable")
            
        if conv.status != ConversationStatus.OPEN:
            raise HTTPException(status_code=403, detail="La conversation n'est pas ouverte.")

        # 2. IA Moderation
        mod_result = await ModerationService.moderate_text(content)
        
        # Mettre à jour le risk score
        conv.risk_score = min(100, conv.risk_score + mod_result["risk"])
        if conv.risk_score >= 80:
            conv.status = ConversationStatus.BLOCKED
            
        if mod_result["decision"] == "BLOCK":
            db.commit()
            raise HTTPException(status_code=400, detail=f"Message bloqué par la modération: {mod_result['reason']}")

        # 3. Create Message
        msg = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            message_type=message_type,
            content=content,
            status="SENT"
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        # 4. Events
        event_bus.publish('message.created', message_id=str(msg.id), conversation_id=str(conversation_id))
        event_bus.publish('audit.log', 
            entity_type='Message', 
            entity_id=msg.id, 
            action='SENT',
            user_id=sender_id,
            metadata={'risk': mod_result['risk']}
        )
        
        return msg
