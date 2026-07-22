"""
DashboardService — Agrège toutes les statistiques du dashboard recruteur
en un seul appel base de données, selon le pattern Service → Repository.

Ce service est conçu pour être scalable : si demain on ajoute des
notifications ou des statistiques avancées, on les ajoute ici sans
toucher au endpoint.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, cast
from uuid import UUID

from app.models.recruitment import RecruitmentRequest, RecruitmentRequestStatus, SavedTalent
from app.models.messaging import Conversation, ConversationParticipant
from app.models.profile import Profile
from app.models.user import User
from app.models.video import Video, VideoStatus, VideoLike, VideoView


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

    # ─────────────────────────────────────────────────────────────────────────────
    # TALENT DASHBOARD
    # ─────────────────────────────────────────────────────────────────────────────

    @staticmethod
    def get_talent_dashboard(db: Session, talent_id: UUID) -> dict:
        """
        Retourne le DTO complet du dashboard talent en un seul appel.

        Contient :
        - KPIs globaux (vues, likes, engagement_rate, favoris, contacts recruteurs)
        - Stats par vidéo (views, likes, avg_watch_seconds, completion_rate)
        - profile_views (préparé pour le futur, actuellement 0)
        """
        # ─ Toutes les vidéos du talent ─────────────────────────────────────
        videos = (
            db.query(Video)
            .filter(Video.user_id == talent_id)
            .order_by(Video.created_at.desc())
            .all()
        )
        video_ids = [v.id for v in videos]

        # ─ Agrégats globaux (vues & likes en cache, rapides) ───────────────
        total_views = sum(v.views_count for v in videos)
        total_likes = sum(v.likes_count for v in videos)
        engagement_rate = round((total_likes / total_views * 100), 1) if total_views > 0 else 0.0

        # ─ Comptage par statut ──────────────────────────────────────────
        published = sum(1 for v in videos if v.status == VideoStatus.PUBLISHED)
        pending = sum(
            1 for v in videos
            if v.status in (VideoStatus.PROCESSING, VideoStatus.PENDING_CONSENT, VideoStatus.UPLOADING)
        )
        rejected = sum(1 for v in videos if v.status == VideoStatus.REJECTED)

        # ─ Fois mis en favori par les recruteurs ──────────────────────────
        times_saved = (
            db.query(func.count(SavedTalent.id))
            .filter(SavedTalent.talent_id == talent_id)
            .scalar()
        ) or 0

        # ─ Recruteurs qui ont envoyé une demande de contact ────────────────
        recruiter_contacts = (
            db.query(func.count(RecruitmentRequest.id))
            .filter(RecruitmentRequest.subject_talent_id == talent_id)
            .scalar()
        ) or 0

        # ─ Stats par vidéo (avg_watch_seconds + completion_rate depuis video_views) ─
        view_stats_by_video: dict = {}
        if video_ids:
            rows = (
                db.query(
                    VideoView.video_id,
                    func.avg(VideoView.watched_seconds).label("avg_watch"),
                    func.count(VideoView.id).label("view_count"),
                    func.sum(cast(VideoView.completed, Integer)).label("completed_count"),
                )
                .filter(VideoView.video_id.in_(video_ids))
                .group_by(VideoView.video_id)
                .all()
            )
            for row in rows:
                completion_rate = round(
                    (row.completed_count / row.view_count * 100), 1
                ) if row.view_count and row.view_count > 0 else 0.0
                view_stats_by_video[str(row.video_id)] = {
                    "avg_watch_seconds": round(float(row.avg_watch or 0), 1),
                    "completion_rate": completion_rate,
                }

        # ─ Construction du DTO par vidéo ──────────────────────────────────
        videos_dto = []
        for v in videos:
            vstats = view_stats_by_video.get(str(v.id), {
                "avg_watch_seconds": 0.0,
                "completion_rate": 0.0,
            })
            videos_dto.append({
                "id": str(v.id),
                "title": v.title,
                "description": v.description,
                "status": v.status,
                "views_count": v.views_count,
                "likes_count": v.likes_count,
                "avg_watch_seconds": vstats["avg_watch_seconds"],
                "completion_rate": vstats["completion_rate"],
                "ai_tags": v.ai_tags or [],
                "created_at": v.created_at,
            })

        return {
            # KPIs globaux
            "total_views": total_views,
            "total_likes": total_likes,
            "engagement_rate": engagement_rate,
            "total_videos": len(videos),
            "published_videos": published,
            "pending_videos": pending,
            "rejected_videos": rejected,
            "times_saved_as_favorite": times_saved,
            "recruiter_contacts": recruiter_contacts,
            # Préparé pour le futur — sera rempli quand on tracera les visites de profil
            "profile_views": 0,
            # Détail par vidéo
            "videos": videos_dto,
        }
