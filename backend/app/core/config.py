"""
Kivora Central Configuration & Environment Management
Safely loads environment variables from backend/.env or project root .env.
Never exposes sensitive API keys or credentials.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve repository paths
APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Load .env file with priority: backend/.env -> root/.env -> system env
BACKEND_ENV_PATH = BACKEND_DIR / ".env"
ROOT_ENV_PATH = ROOT_DIR / ".env"

if BACKEND_ENV_PATH.is_file():
    load_dotenv(dotenv_path=BACKEND_ENV_PATH)
elif ROOT_ENV_PATH.is_file():
    load_dotenv(dotenv_path=ROOT_ENV_PATH)
else:
    load_dotenv()

# Environment settings
KIVORA_ENV = os.getenv("KIVORA_ENV", os.getenv("ENV", "development")).lower()
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kivora.db")
UPLOAD_DIR = Path(os.getenv("KIVORA_UPLOAD_DIR", "uploads"))

# Gemini AI settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


# Email settings
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")

# OAuth 2.0 / OpenID Connect settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")


def reload_env_if_needed():
    """Reloads .env file dynamically if new environment variables were added at runtime."""
    if BACKEND_ENV_PATH.is_file():
        load_dotenv(dotenv_path=BACKEND_ENV_PATH, override=True)
    elif ROOT_ENV_PATH.is_file():
        load_dotenv(dotenv_path=ROOT_ENV_PATH, override=True)


def get_google_client_id() -> str:
    val = os.getenv("GOOGLE_CLIENT_ID") or GOOGLE_CLIENT_ID
    if not val:
        reload_env_if_needed()
        val = os.getenv("GOOGLE_CLIENT_ID")
    return val or ""


def get_google_client_secret() -> str:
    val = os.getenv("GOOGLE_CLIENT_SECRET") or GOOGLE_CLIENT_SECRET
    if not val:
        reload_env_if_needed()
        val = os.getenv("GOOGLE_CLIENT_SECRET")
    return val or ""


def get_github_client_id() -> str:
    val = os.getenv("GITHUB_CLIENT_ID") or GITHUB_CLIENT_ID
    if not val:
        reload_env_if_needed()
        val = os.getenv("GITHUB_CLIENT_ID")
    return val or ""


def get_github_client_secret() -> str:
    val = os.getenv("GITHUB_CLIENT_SECRET") or GITHUB_CLIENT_SECRET
    if not val:
        reload_env_if_needed()
        val = os.getenv("GITHUB_CLIENT_SECRET")
    return val or ""


def is_gemini_configured() -> bool:
    """Check if a Gemini API key is configured without exposing it."""
    key = os.getenv("GEMINI_API_KEY")
    return bool(key and key.strip())


def is_google_oauth_configured() -> bool:
    """Check if Google OAuth is fully configured."""
    cid = get_google_client_id()
    csec = get_google_client_secret()
    return bool(cid and cid.strip() and csec and csec.strip())


def is_github_oauth_configured() -> bool:
    """Check if GitHub OAuth is fully configured."""
    cid = get_github_client_id()
    csec = get_github_client_secret()
    return bool(cid and cid.strip() and csec and csec.strip())
