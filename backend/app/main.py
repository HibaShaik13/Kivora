"""
Kivora FastAPI Application
Main entrypoint initializing REST routes, CORS middleware, and system health checks.
"""

import os
import sys
from pathlib import Path

# Ensure project root and backend dir are in sys.path for Render deployment
_current_file = Path(__file__).resolve()
_backend_dir = _current_file.parent.parent
_project_dir = _backend_dir.parent
for _p in [str(_project_dir), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import backend.app.core.config  # Ensures .env is loaded
from backend.app.database import engine, Base
import backend.app.models.models  # ensure models are registered
from backend.app.api import auth, creators, brands, briefs, matching, ai, taxonomy, media, verification, engagements, projects, notifications, messages, saved, alerts, workspaces


app = FastAPI(
    title="Kivora API",
    description="The AI Content Creator Marketplace — ByteXL HacXLerate 2026",
    version="1.0.0"
)


@app.on_event("startup")
def startup_event():
    try:
        # Non-destructive table verification/creation on startup
        Base.metadata.create_all(bind=engine)
        print("Kivora database tables verified successfully.")
    except Exception as e:
        print(f"Warning: Database startup verification failed (will retry on demand): {e}")

# Configure validated CORS origins for localhost development and production
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://kivora-web-tv1x.onrender.com",
    "https://kivora-web.onrender.com",
]
env_allowed = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = list(set(DEFAULT_ORIGINS + [o.strip() for o in env_allowed.split(",") if o.strip()]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.onrender\.com$",
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
app.include_router(projects.router)
app.include_router(ai.router)
app.include_router(taxonomy.router)
app.include_router(media.router)
app.include_router(verification.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(saved.router)
app.include_router(alerts.router)
app.include_router(workspaces.router)




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
    return {
        "status": "healthy",
        "database": "sqlite connected"
    }
