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
SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET_KEY"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kivora.db")
UPLOAD_DIR = Path(os.getenv("KIVORA_UPLOAD_DIR", "uploads"))

# CORS settings
DEFAULT_LOCAL_ORIGINS = [
    "https://kivora-frontend.onrender.com",
    "https://kivora.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]
CORS_ORIGINS_RAW = os.getenv("KIVORA_CORS_ORIGINS", "")
_custom_origins = [orig.strip() for orig in CORS_ORIGINS_RAW.split(",") if orig.strip()]
# Merge custom origins with default local origins, preserving unique order
CORS_ORIGINS = list(dict.fromkeys(DEFAULT_LOCAL_ORIGINS + _custom_origins))

# Gemini AI settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


# Email settings
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "shaikhibatharunnum@gmail.com")

# SMTP Configuration (e.g. Gmail SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", os.getenv("SMTP_SERVER", "smtp.gmail.com"))
try:
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
except ValueError:
    SMTP_PORT = 587
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SENDER_EMAIL", "shaikhibatharunnum@gmail.com"))
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Kivora Platform")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "t", "yes")


def is_smtp_configured() -> bool:
    """Check if SMTP credentials are configured without exposing them."""
    return bool(SMTP_USERNAME and SMTP_PASSWORD and SMTP_HOST)


def is_gemini_configured() -> bool:
    """Check if a Gemini API key is configured without exposing it."""
    key = os.getenv("GEMINI_API_KEY")
    return bool(key and key.strip())
