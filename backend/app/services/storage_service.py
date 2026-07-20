import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException, status

UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"]
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

class StorageService:
    @staticmethod
    async def save_video(file: UploadFile, user_id: str) -> str:
        """
        Sauvegarde une vidéo localement et retourne son chemin d'accès public.
        Prêt à être remplacé par une implémentation S3.
        """
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Type de fichier non autorisé. Seules les vidéos MP4, MOV et WebM sont acceptées."
            )
            
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier est trop volumineux. La limite est de 50 Mo."
            )

        extension = file.filename.split(".")[-1] if "." in file.filename else "mp4"
        file_name = f"{user_id}_{uuid.uuid4().hex}.{extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Retourne l'URL relative pour accéder au fichier
        return f"/uploads/{file_name}"
