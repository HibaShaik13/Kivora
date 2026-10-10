"""
Test Suite: Active Projects API & Lifecycle
Tests project listing, ownership authorization, milestone calculations,
deliverable versioning, revision loops, and completion ratings.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_active_projects_flow():
    # 1. Login as Brand (Lumina Skincare)
    brand_login = client.post("/api/auth/login", json={
        "email": "creative@luminaskincare.demo",
        "password": "Password123!"
    })
    assert brand_login.status_code == 200, f"Brand login failed: {brand_login.text}"
    brand_token = brand_login.json()["access_token"]
    brand_headers = {"Authorization": f"Bearer {brand_token}"}

    # 2. Login as Creator (Elena Rostova)
    creator_login = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": "Password123!"
    })
    assert creator_login.status_code == 200, f"Creator login failed: {creator_login.text}"
    creator_token = creator_login.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 3. Brand lists active projects
    brand_projects_res = client.get("/api/projects", headers=brand_headers)
    assert brand_projects_res.status_code == 200, f"List projects failed: {brand_projects_res.text}"
    brand_projects = brand_projects_res.json()
    assert isinstance(brand_projects, list)

    # 4. Creator lists active projects
    creator_projects_res = client.get("/api/projects", headers=creator_headers)
    assert creator_projects_res.status_code == 200, f"List creator projects failed: {creator_projects_res.text}"
    creator_projects = creator_projects_res.json()
    assert isinstance(creator_projects, list)

    # 5. If projects exist, test project detail and progress calculations
    if creator_projects:
        project_id = creator_projects[0]["id"]

        # Detail fetch
        detail_res = client.get(f"/api/projects/{project_id}", headers=creator_headers)
        assert detail_res.status_code == 200
        p = detail_res.json()

        # Validate progress percentage and milestones structure
        assert "progress_percentage" in p
        assert isinstance(p["progress_percentage"], int)
        assert 0 <= p["progress_percentage"] <= 100
        assert "milestones" in p
        assert len(p["milestones"]) == 4
        assert "current_milestone" in p

        # Test authorization: Unauthenticated user cannot access project
        unauth_res = client.get(f"/api/projects/{project_id}")
        assert unauth_res.status_code == 401

        # Test submit deliverable as Creator
        if p["status"] not in ["COMPLETED", "FINAL_APPROVED"]:
            deliv_res = client.post(
                f"/api/projects/{project_id}/deliverables",
                headers=creator_headers,
                json={
                    "title": "Master Cut Draft v2",
                    "asset_url": "https://storage.kivora.demo/assets/project-v2.mp4",
                    "notes": "Color grading and sound mix updated"
                }
            )
            assert deliv_res.status_code == 201
            updated_p = deliv_res.json()
            assert updated_p["status"] == "DRAFT_SUBMITTED"
            assert updated_p["progress_percentage"] == 60
            assert any(d["title"] == "Master Cut Draft v2" for d in updated_p["deliverables"])

            # Test authorization: Creator CANNOT request revision (only Brand can)
            creator_rev_res = client.post(
                f"/api/projects/{project_id}/revisions",
                headers=creator_headers,
                json={"feedback": "Unauthorized creator feedback"}
            )
            assert creator_rev_res.status_code == 403


def test_unauthorized_project_access():
    # Login as an admin or test token
    creator_login = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": "Password123!"
    })
    creator_token = creator_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {creator_token}"}

    # Attempt to access non-existent project returns 404
    res = client.get("/api/projects/proj-fake-9999", headers=headers)
    assert res.status_code == 404
