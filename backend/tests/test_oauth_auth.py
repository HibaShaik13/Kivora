"""
Tests for Kivora OAuth 2.0 / OpenID Connect Authentication (Google & GitHub)
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.models import User, CreatorProfile

def test_oauth_status_endpoint(client):
    res = client.get("/api/auth/oauth/status")
    assert res.status_code == 200
    data = res.json()
    assert "google" in data
    assert "github" in data
    assert "callback_url" in data["google"]
    assert "callback_url" in data["github"]
    assert "required_env" in data["google"]
    assert "required_env" in data["github"]


def test_oauth_authorize_unconfigured_reports_setup(client, monkeypatch):
    import backend.app.api.auth as auth_module
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: False)
    monkeypatch.setattr(auth_module, "is_github_oauth_configured", lambda: False)

    # When not configured, calling authorize should return HTTP 400 with helpful guidance
    res_google = client.get("/api/auth/oauth/google/authorize")
    assert res_google.status_code == 400
    assert "Google OAuth is not configured" in res_google.json()["detail"]

    res_github = client.get("/api/auth/oauth/github/authorize")
    assert res_github.status_code == 400
    assert "GitHub OAuth is not configured" in res_github.json()["detail"]


def test_oauth_authorize_configured(client, monkeypatch):
    import backend.app.api.auth as auth_module
    monkeypatch.setattr(auth_module, "get_google_client_id", lambda: "mock-google-client-id")
    monkeypatch.setattr(auth_module, "get_google_client_secret", lambda: "mock-google-client-secret")
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: True)

    res = client.get("/api/auth/oauth/google/authorize?role=CREATOR")
    assert res.status_code == 200
    data = res.json()
    assert "authorization_url" in data
    assert "accounts.google.com" in data["authorization_url"]
    assert "mock-google-client-id" in data["authorization_url"]
    assert "state" in data


def test_oauth_google_callback_creates_user(client, monkeypatch, db_session):
    import backend.app.api.auth as auth_module
    monkeypatch.setattr(auth_module, "get_google_client_id", lambda: "mock-google-client-id")
    monkeypatch.setattr(auth_module, "get_google_client_secret", lambda: "mock-google-client-secret")
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: True)

    mock_email = f"google_user_{uuid.uuid4().hex[:6]}@example.com"

    def mock_requests_post(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {"access_token": "mock-google-access-token"}
        resp.text = '{"access_token": "mock-google-access-token"}'
        return resp

    def mock_requests_get(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {
            "email": mock_email,
            "name": "Google Test Creator",
            "picture": "https://example.com/avatar.jpg"
        }
        return resp

    monkeypatch.setattr("requests.post", mock_requests_post)
    monkeypatch.setattr("requests.get", mock_requests_get)

    res = client.post("/api/auth/oauth/google/callback", json={
        "code": "mock-auth-code",
        "role": "CREATOR"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == mock_email
    assert data["user"]["role"] == "CREATOR"
    assert data["user"]["is_email_verified"] is True

    # Verify user exists in database
    db_user = db_session.query(User).filter(User.email == mock_email).first()
    assert db_user is not None
    assert db_user.is_email_verified is True
    assert db_user.creator_profile is not None
    assert db_user.creator_profile.display_name == "Google Test Creator"


def test_oauth_github_callback_creates_user(client, monkeypatch, db_session):
    import backend.app.api.auth as auth_module
    monkeypatch.setattr(auth_module, "get_github_client_id", lambda: "mock-github-client-id")
    monkeypatch.setattr(auth_module, "get_github_client_secret", lambda: "mock-github-client-secret")
    monkeypatch.setattr(auth_module, "is_github_oauth_configured", lambda: True)

    mock_email = f"github_user_{uuid.uuid4().hex[:6]}@example.com"

    def mock_requests_post(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {"access_token": "mock-github-access-token"}
        resp.text = '{"access_token": "mock-github-access-token"}'
        return resp

    def mock_requests_get(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {
            "email": mock_email,
            "login": "octocat-creator",
            "name": "Octocat Creator",
            "avatar_url": "https://example.com/octocat.jpg"
        }
        return resp

    monkeypatch.setattr("requests.post", mock_requests_post)
    monkeypatch.setattr("requests.get", mock_requests_get)

    res = client.post("/api/auth/oauth/github/callback", json={
        "code": "mock-github-code",
        "role": "CREATOR"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == mock_email
    assert data["user"]["role"] == "CREATOR"
    assert data["user"]["is_email_verified"] is True


def test_oauth_production_authorization_url_generation(client, monkeypatch):
    """Verifies that in production the authorization URL uses the exact production callback."""
    import urllib.parse
    import backend.app.api.auth as auth_module

    prod_backend = "https://kivora-api-n7m1.onrender.com"
    monkeypatch.setattr(auth_module, "get_backend_url", lambda: prod_backend)
    monkeypatch.setattr(auth_module, "get_google_client_id", lambda: "prod-google-client-id")
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: True)

    res = client.get("/api/auth/oauth/google/authorize?role=CREATOR")
    assert res.status_code == 200
    auth_url = res.json()["authorization_url"]

    parsed = urllib.parse.urlparse(auth_url)
    qs = urllib.parse.parse_qs(parsed.query)

    assert qs["client_id"] == ["prod-google-client-id"]
    assert qs["redirect_uri"] == [f"{prod_backend}/api/auth/oauth/google/callback"]
    assert qs["response_type"] == ["code"]
    assert qs["scope"] == ["openid email profile"]
    assert qs["access_type"] == ["offline"]
    assert qs["prompt"] == ["select_account"]


def test_oauth_localhost_authorization_url_generation(client, monkeypatch):
    """Verifies that in local development the authorization URL uses the localhost callback."""
    import urllib.parse
    import backend.app.api.auth as auth_module

    local_backend = "http://localhost:8000"
    monkeypatch.setattr(auth_module, "get_backend_url", lambda: local_backend)
    monkeypatch.setattr(auth_module, "get_google_client_id", lambda: "local-google-client-id")
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: True)

    res = client.get("/api/auth/oauth/google/authorize?role=BRAND")
    assert res.status_code == 200
    auth_url = res.json()["authorization_url"]

    parsed = urllib.parse.urlparse(auth_url)
    qs = urllib.parse.parse_qs(parsed.query)

    assert qs["client_id"] == ["local-google-client-id"]
    assert qs["redirect_uri"] == [f"{local_backend}/api/auth/oauth/google/callback"]


def test_oauth_get_callback_success_redirects_to_frontend(client, monkeypatch, db_session):
    """Verifies that the GET browser callback completes exchange and redirects to frontend with token."""
    import backend.app.api.auth as auth_module

    prod_frontend = "https://kivora-frontend.onrender.com"
    prod_backend = "https://kivora-api-n7m1.onrender.com"
    monkeypatch.setattr(auth_module, "get_frontend_url", lambda: prod_frontend)
    monkeypatch.setattr(auth_module, "get_backend_url", lambda: prod_backend)
    monkeypatch.setattr(auth_module, "get_google_client_id", lambda: "mock-google-client-id")
    monkeypatch.setattr(auth_module, "get_google_client_secret", lambda: "mock-google-client-secret")
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: True)

    mock_email = f"cb_user_{uuid.uuid4().hex[:6]}@example.com"

    def mock_requests_post(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {"access_token": "mock-token-123"}
        resp.text = '{"access_token": "mock-token-123"}'
        return resp

    def mock_requests_get(url, *args, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {
            "email": mock_email,
            "name": "Callback User",
            "picture": "https://example.com/pic.jpg",
        }
        return resp

    monkeypatch.setattr("requests.post", mock_requests_post)
    monkeypatch.setattr("requests.get", mock_requests_get)

    res = client.get(
        "/api/auth/oauth/google/callback?code=test-auth-code&state=test-state",
        follow_redirects=False,
    )
    assert res.status_code == 302
    location = res.headers.get("location", "")
    assert location.startswith(prod_frontend)
    assert "oauth_token=" in location
    assert f"email={mock_email}" in location


def test_oauth_get_callback_provider_error_redirects_to_frontend(client, monkeypatch):
    """Verifies that if user denies consent or provider sends error, redirect to frontend with error query."""
    import backend.app.api.auth as auth_module

    prod_frontend = "https://kivora-frontend.onrender.com"
    monkeypatch.setattr(auth_module, "get_frontend_url", lambda: prod_frontend)

    res = client.get(
        "/api/auth/oauth/google/callback?error=access_denied&error_description=User+declined+permission",
        follow_redirects=False,
    )
    assert res.status_code == 302
    location = res.headers.get("location", "")
    assert location.startswith(prod_frontend)
    assert "oauth_error=" in location


def test_oauth_status_does_not_leak_secrets(client, monkeypatch):
    """Verifies that status endpoint never leaks client secrets or environment credentials."""
    import backend.app.api.auth as auth_module

    super_secret = "SUPER_SECRET_VALUE_DO_NOT_LEAK_999"
    monkeypatch.setattr(auth_module, "get_google_client_id", lambda: "public-client-id")
    monkeypatch.setattr(auth_module, "get_google_client_secret", lambda: super_secret)
    monkeypatch.setattr(auth_module, "get_github_client_id", lambda: "public-gh-id")
    monkeypatch.setattr(auth_module, "get_github_client_secret", lambda: super_secret)
    monkeypatch.setattr(auth_module, "is_google_oauth_configured", lambda: True)
    monkeypatch.setattr(auth_module, "is_github_oauth_configured", lambda: True)

    res = client.get("/api/auth/oauth/status")
    assert res.status_code == 200
    raw_text = res.text
    assert super_secret not in raw_text
    data = res.json()
    assert "client_secret" not in data["google"]
    assert "client_secret" not in data["github"]

