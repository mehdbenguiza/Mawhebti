from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus
from app.models.user import User, UserRole
from app.models.parent_child import ParentChildLink, LinkStatus
from app.services.event_bus import event_bus

class ContactService:
    @staticmethod
    def create_recruitment_request(db: Session, recruiter_id: UUID, subject_talent_id: UUID, message: str) -> RecruitmentRequest:
        # 1. Vérifier si le Talent existe
        talent = db.query(User).filter(User.id == subject_talent_id).first()
        if not talent or talent.role not in [UserRole.TALENT_MINOR, UserRole.TALENT_MAJOR]:
            raise HTTPException(status_code=404, detail="Talent introuvable.")

        # 2. Règle Zero Trust : Déduire le recipient_id
        recipient_id = talent.id
        
        if talent.role == UserRole.TALENT_MINOR:
            # Chercher le parent approuvé
            link = db.query(ParentChildLink).filter(
                ParentChildLink.child_id == talent.id,
                ParentChildLink.status == LinkStatus.APPROVED
            ).first()
            if not link:
                raise HTTPException(status_code=400, detail="Ce talent mineur n'a pas de parent validé, le contact est impossible.")
            recipient_id = link.parent_id

        # 3. Règle Anti-Spam : Vérifier s'il y a déjà une demande PENDING ou ACCEPTED
        existing_request = db.query(RecruitmentRequest).filter(
            RecruitmentRequest.recruiter_id == recruiter_id,
            RecruitmentRequest.subject_talent_id == subject_talent_id,
            RecruitmentRequest.status.in_([RecruitmentRequestStatus.PENDING, RecruitmentRequestStatus.ACCEPTED])
        ).first()

        if existing_request:
            raise HTTPException(status_code=400, detail="Une demande de contact est déjà en cours ou acceptée pour ce talent.")

        # 4. Créer la demande
        req = RecruitmentRequest(
            recruiter_id=recruiter_id,
            recipient_id=recipient_id,
            subject_talent_id=subject_talent_id,
            message=message,
            status=RecruitmentRequestStatus.PENDING
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # 5. Emettre les événements
        event_bus.publish('audit.log', 
            entity_type='RecruitmentRequest', 
            entity_id=req.id, 
            action='CREATED', 
            user_id=recruiter_id,
            metadata={'recipient_id': str(recipient_id), 'talent_id': str(subject_talent_id)}
        )
        
        event_bus.publish('notification.send',
            recipient_id=recipient_id,
            notification_type='CONTACT_REQUEST',
            title='Nouvelle demande de contact',
            body=f'Un recruteur souhaite entrer en contact pour le talent.',
            link=f'/dashboard/requests/{req.id}',
            priority='HIGH'
        )

        return req
