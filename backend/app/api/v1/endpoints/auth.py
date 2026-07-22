from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserAccountUpdate
from app.schemas.auth import LoginRequest, Token
from app.services.auth_service import create_user, get_user_by_email
from app.core.security import verify_password, create_access_token, get_password_hash
from datetime import timedelta

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return create_user(db, user=user_in)

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from app.api.dependencies import get_current_user
from app.models.user import User

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me/account", response_model=UserResponse)
def update_account(
    account_update: UserAccountUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if account_update.email or account_update.new_password:
        if not account_update.current_password or not verify_password(account_update.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect ou manquant")
    
    if account_update.email:
        existing_user = get_user_by_email(db, email=account_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")
        current_user.email = account_update.email
        
    if account_update.phone_number is not None:
        current_user.phone_number = account_update.phone_number
        
    if account_update.new_password:
        current_user.password_hash = get_password_hash(account_update.new_password)
        
    db.commit()
    db.refresh(current_user)
    return current_user
