from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole, UserStatus
from app.models.parent_child import ParentChildLink, LinkStatus
from app.schemas.parent_child import ParentChildLinkRequest, ParentChildLinkResponse
from app.core.security import verify_password

router = APIRouter()

class HandleRequestPayload(BaseModel):
    action: str  # "approve" or "reject"
    password: str  # Obligatoire pour prouver que c'est bien le parent

@router.post("/link", response_model=ParentChildLinkResponse)
def link_parent(
    request: ParentChildLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.TALENT_MINOR:
        raise HTTPException(status_code=403, detail="Seuls les talents mineurs peuvent lier un parent.")
        
    parent = db.query(User).filter(User.email == request.parent_email, User.role == UserRole.PARENT).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent introuvable ou rôle invalide.")
        
    existing = db.query(ParentChildLink).filter(
        ParentChildLink.child_id == current_user.id,
        ParentChildLink.parent_id == parent.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Lien déjà existant ou en attente.")
        
    link = ParentChildLink(
        child_id=current_user.id,
        parent_id=parent.id,
        parent_email=request.parent_email,
        status=LinkStatus.PENDING
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.get("/requests", response_model=List[ParentChildLinkResponse])
def get_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Réservé aux parents.")
        
    # Auto-link: Lier les requêtes créées avec l'email du parent avant son inscription
    unlinked_requests = db.query(ParentChildLink).filter(
        ParentChildLink.parent_email == current_user.email,
        ParentChildLink.parent_id == None
    ).all()
    
    for req in unlinked_requests:
        req.parent_id = current_user.id
    if unlinked_requests:
        db.commit()
        
    return db.query(ParentChildLink).filter(
        ParentChildLink.parent_id == current_user.id,
        ParentChildLink.status == LinkStatus.PENDING
    ).all()

@router.put("/requests/{link_id}", response_model=ParentChildLinkResponse)
def handle_request(
    link_id: str,
    payload: HandleRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Réservé aux parents.")
        
    # Vérification anti-fraude: le parent doit taper son mot de passe
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect. Action non autorisée.")
        
    link = db.query(ParentChildLink).filter(
        ParentChildLink.id == link_id,
        ParentChildLink.parent_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
        
    child_user = db.query(User).filter(User.id == link.child_id).first()
        
    if payload.action == "approve":
        link.status = LinkStatus.APPROVED
        if child_user:
            child_user.status = UserStatus.ACTIVE
    elif payload.action == "reject":
        link.status = LinkStatus.REJECTED
        if child_user:
            child_user.status = UserStatus.BLOCKED
    else:
        raise HTTPException(status_code=400, detail="Action invalide (use approve or reject).")
        
    db.commit()
    db.refresh(link)
    return link
