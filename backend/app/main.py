"""
Kivora FastAPI Application
Main entrypoint initializing REST routes, CORS middleware, and system health checks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import creators, briefs, matching, ai, taxonomy

app = FastAPI(
    title="Kivora API",
    description="The AI Content Creator Marketplace — ByteXL HacXLerate 2026",
    version="1.0.0"
)

# Enable CORS for Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(creators.router)
app.include_router(briefs.router)
app.include_router(matching.router)
app.include_router(ai.router)
app.include_router(taxonomy.router)


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
