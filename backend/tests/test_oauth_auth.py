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
