"""
Kivora Production Server Runner
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

if __name__ == "__main__":
    try:
        import uvicorn
        port = int(os.environ.get("PORT", 8000))
        print(f"--> Starting Kivora Production API on 0.0.0.0:{port}...", flush=True)
        uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, log_level="info")
    except BaseException as e:
        tb = traceback.format_exc()
        print(f"--> FATAL STARTUP EXCEPTION: {e}\n{tb}", file=sys.stderr, flush=True)
        sys.exit(1)
