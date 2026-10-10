"""
Kivora Production Entry Point
Runs the FastAPI application using uvicorn with explicit error logging and dynamic port handling.
"""

import os
import sys
import traceback
from pathlib import Path

# Ensure root and backend are on sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.environ.get("PORT", 8000))
        print(f"--> Starting Kivora Production API on 0.0.0.0:{port}...")
        uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print(f"--> CRITICAL STARTUP ERROR: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
