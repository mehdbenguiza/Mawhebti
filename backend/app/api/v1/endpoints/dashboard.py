"""
Dashboard endpoints — Agrège les métriques en un seul appel par rôle.

Routes:
  GET /dashboard/talent    → KPIs + stats vidéo du talent connecté
  GET /dashboard/recruiter → Stats agrégées du recruteur connecté (alias de /recruitment/dashboard)

Séparation claire :
  /dashboard/* → vues agrégées multi-domaines (vidéos + recrutement + profil)
  /videos/*    → opérations CRUD vidéo
  /recruitment/* → opérations recrutement
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/talent")
def get_talent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne le DTO complet du dashboard talent en un seul appel API.
    Réservé aux rôles TALENT_MAJOR et TALENT_MINOR.

    Inclut :
    - KPIs globaux : vues, likes, taux d'engagement, favoris recruteurs, contacts
    - Métriques par vidéo : avg_watch_seconds, completion_rate
    - profile_views : préparé pour le futur (actuellement 0)
    """
    if current_user.role not in (UserRole.TALENT_MAJOR, UserRole.TALENT_MINOR, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Réservé aux talents.")

    return DashboardService.get_talent_dashboard(db, current_user.id)


@router.get("/recruiter")
def get_recruiter_dashboard_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alias du dashboard recruteur sous /dashboard/recruiter.
    Délègue à DashboardService.get_recruiter_dashboard.
    """
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs.")

    return DashboardService.get_recruiter_dashboard(db, current_user.id)
