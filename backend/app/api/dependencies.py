from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        # Conversion explicite en UUID natif pour assurer la compatibilité
        # avec PostgreSQL (UUID natif) ET SQLite (chaîne) selon l'environnement
        user_id = UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    # Empêcher les utilisateurs bloqués de se connecter
    if user.status == "BLOCKED":
        raise HTTPException(status_code=403, detail="Votre compte a été bloqué.")
        
    return user


def get_optional_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme_optional)):
    if not token:
        return None
    try:
        return get_current_user(db, token)
    except HTTPException:
        return None


def require_trust_level(level: int):
    """
    Dépendance FastAPI pour restreindre l'accès en fonction du niveau de confiance.
    Utilisation: @router.post("/x", dependencies=[Depends(require_trust_level(2))])
    """
    def trust_level_checker(current_user: User = Depends(get_current_user)):
        if current_user.trust_level < level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Niveau de confiance insuffisant. Requis: {level}, Actuel: {current_user.trust_level}"
            )
        return current_user
    return trust_level_checker
