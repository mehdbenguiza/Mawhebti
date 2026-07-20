import uuid
from sqlalchemy import Column, String, Date, DateTime, Text, ForeignKey, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Profile(Base):
    """
    Profil public d'un utilisateur (One-to-One avec User).
    Séparé de User pour limiter l'exposition des données sensibles dans les API publiques.
    """
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Clé étrangère vers User - cascade delete si l'utilisateur est supprimé
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Données personnelles - pas d'info sensible ici, uniquement ce qui est utile au profil public
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)      # Stocké, jamais exposé publiquement
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    # Avatar: stocke uniquement un chemin relatif (ex: "uploads/avatars/uuid.jpg")
    # Jamais de données base64 en base !
    avatar_url = Column(String(512), nullable=True)

    # Compétences/talents (stocké en JSON, compatible PostgreSQL et SQLite pour les tests)
    # Max 20 éléments validé au niveau du schéma Pydantic
    skills = Column(JSON, nullable=True, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relation inverse vers User
    user = relationship("User", back_populates="profile")
