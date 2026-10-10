#!/usr/bin/env bash
set -e

echo "--> [START.SH] Launching Kivora Backend..."
echo "--> [START.SH] PORT is: ${PORT:-8000}"

if command -v python3 >/dev/null 2>&1; then
    echo "--> [START.SH] Using python3..."
    exec python3 run.py
elif command -v python >/dev/null 2>&1; then
    echo "--> [START.SH] Using python..."
    exec python run.py
else
    echo "--> [START.SH] Falling back to uvicorn..."
    exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
fi
