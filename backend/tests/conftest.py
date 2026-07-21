"""
Shared test fixtures for all test modules.
Ensures ALL models are imported before Base.metadata.create_all()
so SQLite gets the complete schema including new columns.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# Import ALL models to ensure they are registered with Base.metadata
import app.models.user          # noqa: F401
import app.models.profile       # noqa: F401
import app.models.video         # noqa: F401
import app.models.parent_child  # noqa: F401
import app.models.messaging     # noqa: F401
import app.models.recruitment   # noqa: F401

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Drop and recreate all tables to get a clean schema each test run
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)
