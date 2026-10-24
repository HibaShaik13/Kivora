"""
Kivora Database Configuration
SQLAlchemy 2.0 Base and SQLite engine setup
"""

import os
from pathlib import Path
import backend.app.core.config  # Ensures .env is loaded
from sqlalchemy import create_engine, event

from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlite3 import Connection as SQLite3Connection

# Resolve default SQLite to root kivora.db consistently
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_SQLITE_PATH = ROOT_DIR / "kivora.db"

raw_db_url = os.getenv("DATABASE_URL")
if not raw_db_url or raw_db_url in ("sqlite:///./kivora.db", "sqlite:///kivora.db"):
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
else:
    DATABASE_URL = raw_db_url

# Normalize postgres:// and postgresql:// to postgresql+psycopg2:// for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

is_sqlite = "sqlite" in DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=not is_sqlite,
)


@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    """Enforce foreign key constraints on every SQLite connection."""
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for FastAPI DB session injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
