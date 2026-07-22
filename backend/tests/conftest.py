"""
Shared test fixtures for all test modules.

IMPORTANT: models MUST be imported before Base.metadata.create_all()
so SQLite gets the complete schema including all new columns.

The FastAPI `app` instance is imported as `_fastapi_app` to avoid
being overwritten when `import app.models.*` adds `app` (the Python
package) to the local namespace.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash

# Import ALL models so SQLAlchemy registers every table/column
import app.models.user          # noqa: F401
import app.models.profile       # noqa: F401
import app.models.video         # noqa: F401
import app.models.parent_child  # noqa: F401
import app.models.messaging     # noqa: F401
import app.models.recruitment   # noqa: F401

from app.models.user import User, UserRole, UserStatus, UserVerificationLevel

# Import AFTER model imports to avoid the name `app` being overwritten
from app.main import app as _fastapi_app  # noqa: E402

# ─────────────────────────────────────────────────────────────────────────────
# Database setup — SQLite for CI speed
# ─────────────────────────────────────────────────────────────────────────────

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Drop and recreate all tables for a clean schema on every test run
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


_fastapi_app.dependency_overrides[get_db] = override_get_db

# ─────────────────────────────────────────────────────────────────────────────
# Pytest Fixtures — utilisées par test_videos.py et les futurs tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def db_session() -> Session:
    """Fournit une session DB propre pour chaque test."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client() -> TestClient:  # type: ignore[misc]
    """Client HTTP anonyme (sans token) — fixture pytest."""
    return TestClient(_fastapi_app)


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    """Crée un utilisateur TALENT_MAJOR de test, nettoyé avant création."""
    db_session.query(User).filter(User.email == "talent@test.com").delete()
    db_session.commit()

    user = User(
        email="talent@test.com",
        password_hash=get_password_hash("testpassword123"),
        role=UserRole.TALENT_MAJOR,
        status=UserStatus.ACTIVE,
        verification_level=UserVerificationLevel.UNVERIFIED,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def authorized_client(test_user: User) -> TestClient:
    """Client HTTP authentifié avec le JWT Bearer du test_user."""
    token = create_access_token(
        data={"sub": str(test_user.id), "role": test_user.role}
    )
    return TestClient(
        _fastapi_app,
        headers={"Authorization": f"Bearer {token}"},
    )
