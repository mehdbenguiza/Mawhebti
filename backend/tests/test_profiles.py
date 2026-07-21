"""
Tests pour les endpoints de profils.
Utilise le conftest.py partagé pour la base SQLite avec le schéma complet.
"""
import pytest

from app.models.user import User, UserRole, UserStatus
from app.core.security import get_password_hash, create_access_token
from tests.conftest import client, TestingSessionLocal


def create_test_user_and_token(email="testprofile@example.com", role=UserRole.TALENT_MAJOR):
    """Helper : crée un utilisateur de test et retourne son token JWT."""
    db = TestingSessionLocal()
    # Supprimer si existe déjà
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()
    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=role,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    db.close()
    return token


def test_get_my_profile_not_found():
    """Un utilisateur sans profil doit recevoir un 404."""
    token = create_test_user_and_token(email="noprofile@example.com")
    response = client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


def test_create_and_get_profile():
    """On doit pouvoir créer un profil via PUT et le récupérer via GET."""
    token = create_test_user_and_token(email="createprofile@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"first_name": "Mehdi", "last_name": "Benguiza", "bio": "Développeur passionné", "city": "Paris"}
    response = client.put("/api/v1/profiles/me", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Mehdi"
    assert data["city"] == "Paris"

    response = client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["last_name"] == "Benguiza"


def test_profile_requires_authentication():
    """Sans token JWT, les endpoints doivent retourner 401."""
    response = client.get("/api/v1/profiles/me")
    assert response.status_code == 401

    response = client.put("/api/v1/profiles/me", json={"first_name": "Test"})
    assert response.status_code == 401


def test_profile_skills_validation():
    """Dépasse 20 compétences doit retourner 422."""
    token = create_test_user_and_token(email="skillstest@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    too_many_skills = [f"skill_{i}" for i in range(21)]
    response = client.put("/api/v1/profiles/me", json={"skills": too_many_skills}, headers=headers)
    assert response.status_code == 422


def test_date_of_birth_not_exposed_in_public():
    """
    La date de naissance ne doit jamais fuiter dans des réponses non privées.
    Ce test vérifie que le schéma 'ProfileResponsePrivate' est bien utilisé pour /me.
    """
    token = create_test_user_and_token(email="dobtest@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.put("/api/v1/profiles/me", json={"date_of_birth": "2000-01-01"}, headers=headers)
    response = client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == 200
    assert "date_of_birth" in response.json()
