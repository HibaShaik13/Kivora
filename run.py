"""
Kivora Production Entry Point
Runs the FastAPI application using uvicorn with explicit remote logging to PostgreSQL for observability.
"""

import os
import sys
import traceback
from pathlib import Path

# Ensure root and backend are in sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)


def log_remote(msg: str):
    """Write diagnostic message to PostgreSQL if DATABASE_URL is available."""
    print(f"--> [KIVORA LOG]: {msg}", flush=True)
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url or "sqlite" in db_url:
        return
    try:
        from sqlalchemy import create_engine, text
        # Normalize postgres:// to postgresql://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(
                text("INSERT INTO deployment_logs (message) VALUES (:m)"),
                {"m": str(msg)[:3000]}
            )
            conn.commit()
    except Exception as e:
        print(f"--> [LOG_REMOTE_FAILED]: {e}", flush=True)


if __name__ == "__main__":
    log_remote(f"STARTING CONTAINER: Python {sys.version}, CWD: {os.getcwd()}")
    try:
        log_remote("Step 1: Testing backend imports...")
        import backend.app.main as main_mod
        log_remote("Step 1 SUCCESS: backend.app.main imported successfully.")

        port = int(os.environ.get("PORT", 8000))
        log_remote(f"Step 2: Binding uvicorn to 0.0.0.0:{port}...")
        import uvicorn
        uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, log_level="info")
    except BaseException as e:
        tb = traceback.format_exc()
        log_remote(f"FATAL STARTUP EXCEPTION: {e}\n{tb}")
        sys.exit(1)
