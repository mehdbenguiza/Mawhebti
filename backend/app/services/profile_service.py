"""
Service Profil - couche métier.
Aucune logique SQL ici, uniquement des opérations via SQLAlchemy ORM.
Principe : le service valide les règles métier, l'endpoint gère l'authentification.
"""
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.profile import Profile
from app.models.user import User, UserStatus
from app.schemas.profile import ProfileUpdate
from typing import List, Optional
from sqlalchemy import or_, cast, String


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


def get_public_profile(db: Session, profile_id: UUID) -> Profile | None:
    """Récupère un profil public uniquement s'il appartient à un utilisateur actif."""
    return db.query(Profile).join(User).filter(
        Profile.id == profile_id,
        User.status == UserStatus.ACTIVE,
        User.deleted_at.is_(None)
    ).first()


def search_talents(
    db: Session,
    query: Optional[str] = None,
    skills: Optional[List[str]] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    category: Optional[str] = None,
    verified: Optional[bool] = None,
    availability: Optional[str] = None,
    age_group: Optional[str] = None,
    sort: Optional[str] = "recent",
    page: int = 1,
    page_size: int = 20
):
    """Recherche de talents avec filtres et pagination."""
    offset = (page - 1) * page_size
    
    q = db.query(Profile).join(User).filter(
        User.status == UserStatus.ACTIVE,
        User.deleted_at.is_(None)
    )

    if query:
        search = f"%{query}%"
        q = q.filter(
            or_(
                Profile.first_name.ilike(search),
                Profile.last_name.ilike(search),
                Profile.bio.ilike(search)
            )
        )
    if city:
        q = q.filter(Profile.city.ilike(f"%{city}%"))
    if country:
        q = q.filter(Profile.country.ilike(f"%{country}%"))
    if verified is not None:
        q = q.filter(User.is_verified == verified)
    if skills:
        for skill in skills:
            # Fallback simple pour SQLite/Postgres : conversion en string pour chercher le mot-clé
            q = q.filter(cast(Profile.skills, String).ilike(f"%{skill}%"))

    # Tri basique
    if sort == "recent":
        q = q.order_by(Profile.created_at.desc())
    elif sort == "popular":
        # Simulé pour l'instant
        q = q.order_by(Profile.created_at.desc())
    else:
        q = q.order_by(Profile.created_at.desc())
        
    total = q.count()
    items = q.offset(offset).limit(page_size).all()
    
    return {"items": items, "total": total, "page": page, "page_size": page_size}
