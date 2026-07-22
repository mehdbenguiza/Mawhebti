"""
DashboardService — Agrège toutes les statistiques du dashboard recruteur
en un seul appel base de données, selon le pattern Service → Repository.

Ce service est conçu pour être scalable : si demain on ajoute des
notifications ou des statistiques avancées, on les ajoute ici sans
toucher au endpoint.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus, SavedTalent
from app.models.messaging import Conversation, ConversationParticipant
from app.models.profile import Profile
from app.models.user import User


class DashboardService:

    @staticmethod
    def get_recruiter_dashboard(db: Session, recruiter_id: UUID) -> dict:
        """
        Retourne un DTO unique contenant toutes les métriques du dashboard recruteur.
        Un seul appel API suffit pour alimenter la page entière.
        """
        # Comptage des demandes de contact par statut
        requests_counts = (
            db.query(
                RecruitmentRequest.status,
                func.count(RecruitmentRequest.id).label("count")
            )
            .filter(RecruitmentRequest.recruiter_id == recruiter_id)
            .group_by(RecruitmentRequest.status)
            .all()
        )
        counts_by_status = {row.status: row.count for row in requests_counts}

        # Comptage des favoris
        saved_count = (
            db.query(func.count(SavedTalent.id))
            .filter(SavedTalent.recruiter_id == recruiter_id)
            .scalar()
        ) or 0

        # Comptage des conversations actives (le recruteur en est participant)
        active_conversations = (
            db.query(func.count(ConversationParticipant.conversation_id))
            .filter(ConversationParticipant.user_id == recruiter_id)
            .scalar()
        ) or 0

        return {
            "saved_talents": saved_count,
            "pending_requests": counts_by_status.get(RecruitmentRequestStatus.PENDING, 0),
            "accepted_requests": counts_by_status.get(RecruitmentRequestStatus.ACCEPTED, 0),
            "rejected_requests": counts_by_status.get(RecruitmentRequestStatus.REJECTED, 0),
            "active_conversations": active_conversations,
        }

    @staticmethod
    def get_saved_talents_page(
        db: Session,
        recruiter_id: UUID,
        page: int = 1,
        page_size: int = 12,
    ) -> dict:
        """
        Retourne une page paginée de talents sauvegardés avec leurs informations
        de profil (avatar, compétences, date de sauvegarde).
        """
        base_query = (
            db.query(SavedTalent, User, Profile)
            .join(User, SavedTalent.talent_id == User.id)
            .outerjoin(Profile, User.id == Profile.user_id)
            .filter(SavedTalent.recruiter_id == recruiter_id)
            .order_by(SavedTalent.created_at.desc())
        )

        total = base_query.count()
        offset = (page - 1) * page_size
        rows = base_query.offset(offset).limit(page_size).all()

        items = []
        for saved, user, profile in rows:
            # Compétence principale = premier élément des skills ou None
            main_skill = None
            if profile and profile.skills and len(profile.skills) > 0:
                main_skill = profile.skills[0]

            items.append({
                "saved_id": str(saved.id),
                "saved_at": saved.created_at,
                "talent": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": profile.first_name if profile else None,
                    "last_name": profile.last_name if profile else None,
                    "avatar_url": profile.avatar_url if profile else None,
                    "city": profile.city if profile else None,
                    "main_skill": main_skill,
                    "skills": profile.skills if profile else [],
                }
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        }
