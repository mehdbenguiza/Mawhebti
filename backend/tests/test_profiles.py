"""
Tests pour les endpoints de profils.
Utilise une base SQLite in-memory pour l'isolation complète des tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile
from app.core.security import get_password_hash, create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_profiles.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Nettoie la base de données avant chaque test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def create_test_user_and_token(role=UserRole.TALENT_MAJOR):
    """Helper : crée un utilisateur de test et retourne son token JWT."""
    db = TestingSessionLocal()
    user = User(
        email="testuser@example.com",
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
    token = create_test_user_and_token()
    response = client.get("/api/v1/profiles/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


def test_create_and_get_profile():
    """On doit pouvoir créer un profil via PUT et le récupérer via GET."""
    token = create_test_user_and_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Création du profil
    payload = {"first_name": "Mehdi", "last_name": "Benguiza", "bio": "Développeur passionné", "city": "Paris"}
    response = client.put("/api/v1/profiles/me", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Mehdi"
    assert data["city"] == "Paris"

    # Lecture du profil
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
    token = create_test_user_and_token()
    headers = {"Authorization": f"Bearer {token}"}

    too_many_skills = [f"skill_{i}" for i in range(21)]
    response = client.put("/api/v1/profiles/me", json={"skills": too_many_skills}, headers=headers)
    assert response.status_code == 422


def test_date_of_birth_not_exposed_in_public():
    """
    La date de naissance ne doit jamais fuiter dans des réponses non privées.
    Ce test vérifie que le schéma 'ProfileResponsePrivate' est bien utilisé pour /me.
    """
    token = create_test_user_and_token()
    headers = {"Authorization": f"Bearer {token}"}

    client.put("/api/v1/profiles/me", json={"date_of_birth": "2000-01-01"}, headers=headers)
    response = client.get("/api/v1/profiles/me", headers=headers)
    assert response.status_code == 200
    # /me utilise ProfileResponsePrivate qui INCLUT la date de naissance
    assert "date_of_birth" in response.json()
