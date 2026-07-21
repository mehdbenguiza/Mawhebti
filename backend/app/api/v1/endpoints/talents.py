from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.profile import PublicProfileResponse
from app.services.profile_service import search_talents, get_public_profile
from pydantic import BaseModel

router = APIRouter()

class PaginatedTalentsResponse(BaseModel):
    items: List[PublicProfileResponse]
    total: int
    page: int
    page_size: int

@router.get("/search", response_model=PaginatedTalentsResponse)
def search_talents_endpoint(
    q: Optional[str] = Query(None, alias="query", description="Recherche par nom ou bio"),
    skills: Optional[List[str]] = Query(None, description="Liste de compétences"),
    city: Optional[str] = Query(None, description="Ville"),
    country: Optional[str] = Query(None, description="Pays"),
    category: Optional[str] = Query(None, description="Catégorie de talent"),
    verified: Optional[bool] = Query(None, description="Profils vérifiés uniquement"),
    availability: Optional[str] = Query(None, description="Disponibilité"),
    age_group: Optional[str] = Query(None, description="Groupe d'âge"),
    sort: Optional[str] = Query("recent", description="Tri (recent, popular, recommended)"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de la page"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    """
    Recherche et découverte de talents.
    Ouvert à tous (anonyme ou connecté). Les résultats sont des PublicProfileResponse
    qui masquent les informations sensibles.
    """
    results = search_talents(
        db=db,
        query=q,
        skills=skills,
        city=city,
        country=country,
        category=category,
        verified=verified,
        availability=availability,
        age_group=age_group,
        sort=sort,
        page=page,
        page_size=page_size
    )
    return results

@router.get("/{talent_id}", response_model=PublicProfileResponse)
def get_talent_public_profile(
    talent_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    """
    Récupère le portfolio public d'un talent.
    Ne retourne que les informations publiques. L'accès est refusé si le talent est suspendu ou supprimé.
    """
    profile = get_public_profile(db, profile_id=talent_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Talent introuvable ou indisponible."
        )
    return profile
