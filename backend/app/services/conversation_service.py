from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.messaging import Conversation, ConversationParticipant, ConversationParticipantRole, ConversationStatus, RecruitmentStage
from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus
from app.services.event_bus import event_bus

class ConversationService:
    @staticmethod
    def create_conversation_from_request(db: Session, request_id: UUID) -> Conversation:
        req = db.query(RecruitmentRequest).filter(RecruitmentRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="Demande introuvable")
            
        if req.status != RecruitmentRequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="La demande n'est pas en attente.")
            
        # Accepter la demande
        req.status = RecruitmentRequestStatus.ACCEPTED
        
        # Créer la conversation
        conv = Conversation(
            subject_talent_id=req.subject_talent_id,
            status=ConversationStatus.OPEN,
            recruitment_stage=RecruitmentStage.NEW_CONTACT,
            risk_score=0
        )
        db.add(conv)
        db.flush() # pour avoir conv.id
        
        # Ajouter les participants
        p_recruiter = ConversationParticipant(
            conversation_id=conv.id,
            user_id=req.recruiter_id,
            role=ConversationParticipantRole.RECRUITER
        )
        p_recipient = ConversationParticipant(
            conversation_id=conv.id,
            user_id=req.recipient_id,
            # Normalement on devrait checker si c'est parent ou talent pour le role
            role=ConversationParticipantRole.PARENT # Simplification pour l'instant
        )
        
        db.add(p_recruiter)
        db.add(p_recipient)
        db.commit()
        db.refresh(conv)
        
        event_bus.publish('audit.log', 
            entity_type='Conversation', 
            entity_id=conv.id, 
            action='CREATED_FROM_REQUEST', 
            metadata={'request_id': str(req.id)}
        )
        
        return conv
