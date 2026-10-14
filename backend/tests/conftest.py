"""
Kivora Pytest Isolated Test Fixtures & Database Safety Guard
Ensures all automated tests run against an isolated in-memory or dedicated test database.
Includes a hard safety guard preventing tests from touching the development 'kivora.db'.
"""

import os
import sys
from pathlib import Path
try:
    import pytest
except ImportError:
    class MockPytest:
        def fixture(self, *args, **kwargs):
            def decorator(f):
                return f
            return decorator
    pytest = MockPytest()

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Ensure backend and root paths are available
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
for p in [str(ROOT_DIR), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app
from backend.app.database import get_db
from backend.app.models.models import Base

# Isolated in-memory SQLite database using StaticPool
# This guarantees that tables exist across all connections and threads in the test process
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def assert_isolated_test_target(db_url: str):
    """Safety guard that aborts execution if tests ever attempt to target the live kivora.db."""
    if "kivora.db" in str(db_url) and "test" not in str(db_url):
        raise RuntimeError(
            "CRITICAL SAFETY VIOLATION: An automated test attempted to connect to "
            f"the development database '{db_url}'. Tests must strictly run on isolated targets."
        )


@pytest.fixture(scope="session", autouse=True)
def verify_test_isolation():
    """Session-level verification enforcing database isolation."""
    assert_isolated_test_target(TEST_DATABASE_URL)
    # Initialize all models on the isolated test engine
    Base.metadata.create_all(bind=test_engine)
    yield
    # Clean teardown
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def isolated_db():
    """Provides a transactional database session rolled back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def db(isolated_db):
    """Alias for isolated_db to support tests requesting db fixture."""
    return isolated_db


@pytest.fixture(scope="function")
def db_session(isolated_db):
    """Alias for isolated_db to support tests requesting db_session fixture."""
    return isolated_db


@pytest.fixture(scope="function")
def client(isolated_db):
    """FastAPI TestClient wired with dependency overrides to the isolated test database."""
    def override_get_db():
        try:
            yield isolated_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)
