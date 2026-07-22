"""
Endpoints de gestion des profils.

Sécurité :
- Toutes les routes sont protégées par `get_current_user` (JWT valide obligatoire).
- Un utilisateur ne peut lire/modifier QUE son propre profil via ces routes.
- Les admins/modérateurs auront des routes séparées dans un module d'administration.
- Le rate limiting doit être configuré au niveau du reverse-proxy (Nginx) en production.
"""
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserStatus
from app.schemas.profile import ProfileResponsePrivate, ProfileUpdate
from app.services.profile_service import get_profile_by_user_id, upsert_profile

router = APIRouter()


def _check_user_active(current_user: User) -> None:
    """
    Vérifie que l'utilisateur est actif (non suspendu, non bloqué, non supprimé).
    Appelé dans chaque endpoint pour bloquer les comptes compromis immédiatement,
    même si leur JWT est encore valide.
    """
    if current_user.status in (UserStatus.SUSPENDED, UserStatus.BLOCKED, UserStatus.DELETED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte a été suspendu ou bloqué. Contactez le support.",
        )


@router.get("/me", response_model=ProfileResponsePrivate)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retourne le profil de l'utilisateur connecté.
    Utilise `ProfileResponsePrivate` qui inclut la date de naissance.
    """
    _check_user_active(current_user)
    profile = get_profile_by_user_id(db, current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil non trouvé. Veuillez le créer d'abord.",
        )
    return profile


@router.put("/me", response_model=ProfileResponsePrivate)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crée ou met à jour le profil de l'utilisateur connecté.
    Utilise une sémantique PATCH (seuls les champs fournis sont modifiés).
    """
    _check_user_active(current_user)
    updated_profile = upsert_profile(db, current_user.id, profile_data)
    return updated_profile

@router.post("/me/avatar", response_model=ProfileResponsePrivate)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload et met à jour l'avatar de l'utilisateur connecté.
    """
    _check_user_active(current_user)
    profile = get_profile_by_user_id(db, current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil non trouvé. Veuillez le créer d'abord.",
        )
    
    os.makedirs("uploads/avatars", exist_ok=True)
    file_extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    
    # Validation du type (basique)
    allowed_extensions = ["jpg", "jpeg", "png", "webp", "gif"]
    if file_extension.lower() not in allowed_extensions:
         raise HTTPException(status_code=400, detail="Format d'image non supporté")
         
    file_path = f"uploads/avatars/{current_user.id}.{file_extension}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    profile.avatar_url = f"/{file_path}"
    db.commit()
    db.refresh(profile)
    
    return profile

