import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, BackgroundTasks
from app.models.video import Video, VideoStatus
from app.models.user import User, UserRole
from app.services.storage_service import StorageService
from app.services.ai_service import ai_service
from app.models.parent_child import ParentChildLink, LinkStatus

class VideoService:
    @staticmethod
    async def process_video_background(video_id: str, file_path_absolute: str):
        from app.core.database import SessionLocal
        """Tâche d'arrière-plan pour analyser la vidéo avec l'IA"""
        ai_result = await ai_service.process_video(file_path_absolute)
        
        db = SessionLocal()
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if video:
                video.transcription = ai_result["transcription"]
                video.ai_tags = ai_result["tags"]
                
                # Si le statut était PROCESSING (pour les majeurs), on le publie directement une fois l'IA terminée
                if video.status == VideoStatus.PROCESSING:
                    video.status = VideoStatus.PUBLISHED
                    
                db.commit()
        finally:
            db.close()

    @staticmethod
    async def upload_video(
        db: Session, 
        user: User, 
        title: str, 
        description: str, 
        file: UploadFile, 
        background_tasks: BackgroundTasks
    ) -> Video:
        
        # 1. Vérifications de sécurité spécifiques au rôle
        initial_status = VideoStatus.PROCESSING
        if user.role == UserRole.TALENT_MINOR:
            # Un mineur doit avoir au moins un parent lié pour uploader
            has_parent = db.query(ParentChildLink).filter(
                ParentChildLink.child_id == user.id,
                ParentChildLink.status == LinkStatus.APPROVED
            ).first()
            
            if not has_parent:
                raise HTTPException(
                    status_code=403, 
                    detail="Vous devez avoir un parent approuvé pour uploader des vidéos."
                )
            initial_status = VideoStatus.PENDING_CONSENT
            
        elif user.role not in [UserRole.TALENT_MAJOR, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Seuls les Talents peuvent uploader des vidéos.")

        # 2. Sauvegarde du fichier via StorageService
        file_url = await StorageService.save_video(file, str(user.id))
        
        # 3. Création de l'entrée en base de données
        new_video = Video(
            user_id=user.id,
            title=title,
            description=description,
            file_path=file_url,
            status=initial_status
        )
        db.add(new_video)
        db.commit()
        db.refresh(new_video)

        # 4. Déduction du chemin absolu pour FFmpeg
        upload_dir = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads"))
        file_name = file_url.split("/")[-1]
        absolute_path = os.path.join(upload_dir, file_name)

        # 5. Lancement de l'IA en tâche de fond (non-bloquant pour l'utilisateur)
        background_tasks.add_task(VideoService.process_video_background, str(new_video.id), absolute_path)

        return new_video

    @staticmethod
    def get_user_videos(db: Session, user_id: str):
        return db.query(Video).filter(Video.user_id == user_id).order_by(Video.created_at.desc()).all()
