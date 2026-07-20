from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.parent_child import ParentChildLink, LinkStatus
from app.schemas.parent_child import ParentChildLinkRequest, ParentChildLinkResponse

router = APIRouter()

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
        
    return db.query(ParentChildLink).filter(
        ParentChildLink.parent_id == current_user.id,
        ParentChildLink.status == LinkStatus.PENDING
    ).all()

@router.put("/requests/{link_id}", response_model=ParentChildLinkResponse)
def handle_request(
    link_id: str,
    action: str, # "approve" or "reject"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Réservé aux parents.")
        
    link = db.query(ParentChildLink).filter(
        ParentChildLink.id == link_id,
        ParentChildLink.parent_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Demande introuvable.")
        
    if action == "approve":
        link.status = LinkStatus.APPROVED
    elif action == "reject":
        link.status = LinkStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Action invalide (use approve or reject).")
        
    db.commit()
    db.refresh(link)
    return link
