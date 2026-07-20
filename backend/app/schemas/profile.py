"""
Schemas Pydantic pour les profils.
Principe de sécurité : on utilise des modèles distincts pour la lecture (Response)
et l'écriture (Update) afin de ne jamais exposer des champs sensibles (date_of_birth, user_id)
dans les réponses publiques.
"""
from datetime import date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class ProfileUpdate(BaseModel):
    """Données que l'utilisateur peut modifier lui-même."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    date_of_birth: Optional[date] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    skills: Optional[List[str]] = Field(None, max_length=20)

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, v):
        if v is not None:
            if len(v) > 20:
                raise ValueError("Maximum 20 compétences autorisées")
            for skill in v:
                if len(skill) > 50:
                    raise ValueError("Chaque compétence doit faire moins de 50 caractères")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_whitespace(cls, v):
        return v.strip() if v else v


class ProfileResponse(BaseModel):
    """
    Réponse publique du profil.
    IMPORTANT : date_of_birth et user_id sont EXCLUS intentionnellement
    pour ne pas exposer des données personnelles sensibles.
    """
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None
    skills: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class ProfileResponsePrivate(ProfileResponse):
    """
    Réponse privée : utilisée uniquement pour l'utilisateur lui-même (GET /profiles/me).
    Inclut des champs sensibles supplémentaires.
    """
    date_of_birth: Optional[date] = None

    model_config = {"from_attributes": True}
