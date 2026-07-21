"""
Shared test fixtures for all test modules.

IMPORTANT: models MUST be imported before Base.metadata.create_all()
so SQLite gets the complete schema including all new columns.

The FastAPI `app` instance is imported as `_fastapi_app` to avoid
being overwritten when `import app.models.*` adds `app` (the Python
package) to the local namespace.
"""
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db

# Import ALL models so SQLAlchemy registers every table/column
import app.models.user          # noqa: F401
import app.models.profile       # noqa: F401
import app.models.video         # noqa: F401
import app.models.parent_child  # noqa: F401
import app.models.messaging     # noqa: F401
import app.models.recruitment   # noqa: F401

# Import AFTER model imports to avoid the name `app` being overwritten
# by `import app.models.*` (which would make `app` the Python package,
# not the FastAPI instance).
from app.main import app as _fastapi_app  # noqa: E402

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

client = TestClient(_fastapi_app)
