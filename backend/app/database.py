"""
Kivora Database Configuration
SQLAlchemy 2.0 Base and SQLite engine setup
"""

import os
import backend.app.core.config  # Ensures .env is loaded
from sqlalchemy import create_engine, event

from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlite3 import Connection as SQLite3Connection

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kivora.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
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
