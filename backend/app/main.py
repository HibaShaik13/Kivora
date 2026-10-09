"""
Kivora FastAPI Application
Main entrypoint initializing REST routes, CORS middleware, and system health checks.
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import backend.app.core.config  # Ensures .env is loaded
from backend.app.api import auth, creators, brands, briefs, matching, ai, taxonomy, media, verification, engagements


from backend.app.core.config import CORS_ORIGINS

app = FastAPI(
    title="Kivora API",
    description="The AI Content Creator Marketplace — ByteXL HacXLerate 2026",
    version="1.0.0"
)

# Enable CORS for configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure configurable upload directory exists and mount static serving
UPLOAD_DIR = Path(os.getenv("KIVORA_UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

PUBLIC_ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "assets"
if PUBLIC_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(PUBLIC_ASSETS_DIR)), name="assets")

# Mount API Routers
app.include_router(auth.router)
app.include_router(creators.router)
app.include_router(brands.router)
app.include_router(briefs.router)
app.include_router(matching.router)
app.include_router(engagements.router)
app.include_router(ai.router)
app.include_router(taxonomy.router)
app.include_router(media.router)
app.include_router(verification.router)



@app.get("/")
def root():
    return {
        "service": "Kivora Marketplace API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    db_status = "connected"
    try:
        from backend.app.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {type(e).__name__}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "environment": os.getenv("KIVORA_ENV", "development"),
        "database": db_status
    }
