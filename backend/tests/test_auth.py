"""
Tests d'authentification.
La base de données SQLite de test est configurée dans conftest.py.
"""
from tests.conftest import client


def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test_auth@example.com", "password": "password123", "role": "TALENT_MAJOR"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_auth@example.com"
    assert "id" in data


def test_register_duplicate_user():
    # Enregistrer une première fois
    client.post(
        "/api/v1/auth/register",
        json={"email": "test_dup@example.com", "password": "password123", "role": "TALENT_MAJOR"}
    )
    # La deuxième fois doit échouer
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test_dup@example.com", "password": "password123", "role": "TALENT_MAJOR"}
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered"}


def test_login_user():
    # D'abord s'inscrire
    client.post(
        "/api/v1/auth/register",
        json={"email": "test_login@example.com", "password": "password123", "role": "TALENT_MAJOR"}
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test_login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_incorrect_password():
    client.post(
        "/api/v1/auth/register",
        json={"email": "test_wrong@example.com", "password": "password123", "role": "TALENT_MAJOR"}
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test_wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
