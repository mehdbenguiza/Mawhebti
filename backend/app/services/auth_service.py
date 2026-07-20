from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

from fastapi import HTTPException, status
from app.models.user import User, UserRole, UserStatus
from app.models.parent_child import ParentChildLink, LinkStatus

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    if user.role == UserRole.TALENT_MINOR and not user.parent_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent email is required for minor talents."
        )

    hashed_password = get_password_hash(user.password)
    
    # Par défaut, le statut d'un mineur est PENDING. Les autres pourraient être ACTIVE ou PENDING_VERIFICATION.
    # Dans ce système Zero Trust, tout le monde commence avec trust_level=0, mais le statut gère la connexion.
    user_status = UserStatus.PENDING if user.role == UserRole.TALENT_MINOR else UserStatus.ACTIVE

    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        status=user_status,
        phone_number=user.phone_number
    )
    db.add(db_user)
    db.flush() # Pour récupérer db_user.id
    
    # Créer le lien parent-enfant si c'est un mineur
    if user.role == UserRole.TALENT_MINOR and user.parent_email:
        # Vérifier si le parent existe déjà pour lier directement l'ID
        parent_user = get_user_by_email(db, user.parent_email)
        parent_id = parent_user.id if parent_user else None
        
        link = ParentChildLink(
            parent_id=parent_id,
            child_id=db_user.id,
            parent_email=user.parent_email,
            status=LinkStatus.PENDING
        )
        db.add(link)

    db.commit()
    db.refresh(db_user)
    return db_user
