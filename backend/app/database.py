"""
Kivora Database Configuration
SQLAlchemy 2.0 Base and SQLite engine setup
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kivora.db")

# For SQLite, ensure foreign keys are enabled via connect listener
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for FastAPI DB session injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
