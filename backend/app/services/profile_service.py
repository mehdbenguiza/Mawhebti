"""
Service Profil - couche métier.
Aucune logique SQL ici, uniquement des opérations via SQLAlchemy ORM.
Principe : le service valide les règles métier, l'endpoint gère l'authentification.
"""
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.profile import Profile
from app.schemas.profile import ProfileUpdate


def get_profile_by_user_id(db: Session, user_id: UUID) -> Profile | None:
    """Récupère le profil d'un utilisateur. Retourne None si inexistant."""
    return db.query(Profile).filter(Profile.user_id == user_id).first()


def upsert_profile(db: Session, user_id: UUID, data: ProfileUpdate) -> Profile:
    """
    Crée ou met à jour le profil d'un utilisateur (upsert).
    Seuls les champs explicitement fournis (non-None) sont modifiés,
    les autres restent inchangés (PATCH semantics).
    """
    profile = get_profile_by_user_id(db, user_id)

    if profile is None:
        # Première fois : création du profil
        profile = Profile(user_id=user_id)
        db.add(profile)

    # Mise à jour uniquement des champs fournis
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
