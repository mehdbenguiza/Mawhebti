import pytest
from app.models.user import User, UserRole, UserStatus
from app.models.profile import Profile
from app.core.security import get_password_hash, create_access_token
from tests.conftest import client, TestingSessionLocal

def create_test_user_with_profile(email, role=UserRole.TALENT_MAJOR, status=UserStatus.ACTIVE, **profile_kwargs):
    db = TestingSessionLocal()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()
    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role=role,
        status=status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    profile = Profile(user_id=user.id, **profile_kwargs)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.close()
    return user, profile

def get_auth_headers(user):
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}

# Tests for Search
def test_search_talents_no_results():
    response = client.get("/api/v1/talents/search?query=xyz123")
    assert response.status_code == 200
    assert response.json()["total"] == 0

def test_search_talents_with_results():
    user, profile = create_test_user_with_profile(
        email="talentsearch1@example.com", 
        first_name="Alice", 
        last_name="Search",
        city="Tunis",
        skills=["Python", "AI"]
    )
    
    response = client.get("/api/v1/talents/search?query=Alice")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(item["first_name"] == "Alice" for item in data["items"])
    
def test_search_filters():
    user1, _ = create_test_user_with_profile("t1@ex.com", city="Sfax", skills=["React"])
    user2, _ = create_test_user_with_profile("t2@ex.com", city="Tunis", skills=["React"])
    
    response = client.get("/api/v1/talents/search?city=Sfax")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert item["city"] == "Sfax"
        
def test_search_inactive_user_hidden():
    user_inactive, _ = create_test_user_with_profile("inactive@ex.com", status=UserStatus.SUSPENDED, first_name="Hidden")
    
    response = client.get("/api/v1/talents/search?query=Hidden")
    assert response.status_code == 200
    assert response.json()["total"] == 0

def test_get_public_profile():
    user, profile = create_test_user_with_profile(
        email="pubprofile@example.com", 
        first_name="Bob",
        date_of_birth="2000-01-01"
    )
    
    response = client.get(f"/api/v1/talents/{profile.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Bob"
    # Ensure sensitive info is NOT exposed
    assert "date_of_birth" not in data

def test_anonymous_access():
    """L'accès anonyme est autorisé pour la recherche et la consultation."""
    user, profile = create_test_user_with_profile("anon@example.com", first_name="AnonSearch")
    
    # Pas de headers
    response = client.get("/api/v1/talents/search?query=AnonSearch")
    assert response.status_code == 200
    assert response.json()["total"] > 0
