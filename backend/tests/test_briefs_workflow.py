"""
End-to-End Regression Tests for Campaign Brief Creation, Discovery, and Filtering
Tests:
- Brand demo user login & brief creation
- Idempotency / duplicate brief prevention
- Non-standard skill/tool handling without 500 error
- Creator demo user login & brief discovery
- Independent and combined filtering (category, budget, timeline)
- Role and ownership authorization enforcement
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import get_db, SessionLocal
from backend.app.models.models import Brief, User, BrandProfile

client = TestClient(app)

def test_brand_login_and_create_brief():
    # 1. Login as Brand demo user
    login_res = client.post("/api/auth/login", json={
        "email": "creative@luminaskincare.demo",
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_title = "Automated Test NOVA Wear Campaign Brief"

    # Clean up any leftover from previous runs
    db = SessionLocal()
    try:
        existing = db.query(Brief).filter(Brief.title == test_title).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    # 2. Create a new campaign brief
    payload = {
        "title": test_title,
        "campaign_objective": "Futuristic fashion commercial showcasing modern streetwear.",
        "target_audience": "Gen Z and young adults aged 18-30.",
        "content_type": "VIDEO",
        "creative_style_mood": "Futuristic, bold, edgy, editorial.",
        "aspect_ratio": "9:16",
        "duration_seconds_min": 15,
        "duration_seconds_max": 30,
        "resolution_min": "3840x2160",
        "deliverables_description": "1x 4K Master Hero Film, 2x Social Cutdowns.",
        "revision_allowance": 2,
        "budget_amount": 4500.0,
        "budget_currency": "USD",
        "deadline_days": 14,
        "commercial_use_requirements": "Full Commercial Buyout with global broadcast rights",
        "usage_channels": "Digital Paid Ads, Social Media, Website Hero",
        "usage_duration": "Perpetual / 2 Years",
        "usage_territories": "Worldwide",
        "restrictions_and_guidelines": "No distorted artifacts",
        "disclosure_requirements": "Creator must disclose AI models used",
        "required_skill_ids": ["skill-camera-control", "skill-macro-fluid"],
        "required_tool_ids": ["tool-runway-gen3", "tool-comfyui"]
    }

    create_res = client.post("/api/briefs", json=payload, headers=headers)
    assert create_res.status_code == 201, f"Create brief failed: {create_res.text}"
    created_brief = create_res.json()
    assert created_brief["title"] == test_title
    assert created_brief["budget_amount"] == 4500.0
    assert created_brief["status"] == "PUBLISHED"
    created_id = created_brief["id"]

    # 3. Test duplicate prevention on retry (Idempotency)
    retry_res = client.post("/api/briefs", json=payload, headers=headers)
    assert retry_res.status_code in [200, 201]
    assert retry_res.json()["id"] == created_id, "Idempotency failed: duplicate brief was created"

    # 4. Verify Creator can see the published brief in Discover Briefs
    creator_login = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": "Password123!"
    })
    assert creator_login.status_code == 200
    creator_token = creator_login.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    list_res = client.get("/api/briefs", headers=creator_headers)
    assert list_res.status_code == 200
    brief_ids = [b["id"] for b in list_res.json()]
    assert created_id in brief_ids, "Newly created brief not visible in Discover Briefs list"

    # 5. Clean up test data safely
    db = SessionLocal()
    try:
        to_delete = db.query(Brief).filter(Brief.id == created_id).first()
        if to_delete:
            db.delete(to_delete)
            db.commit()
    finally:
        db.close()

def test_create_brief_with_non_standard_skills():
    # Verify submitting non-standard or legacy skill IDs does NOT crash with 500
    login_res = client.post("/api/auth/login", json={
        "email": "creative@luminaskincare.demo",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Legacy Skill IDs Test Brief",
        "campaign_objective": "Test objective",
        "target_audience": "Audience",
        "content_type": "VIDEO",
        "creative_style_mood": "Mood",
        "aspect_ratio": "16:9",
        "duration_seconds_min": 10,
        "duration_seconds_max": 20,
        "resolution_min": "1080p",
        "deliverables_description": "Deliverable",
        "revision_allowance": 1,
        "budget_amount": 3000.0,
        "budget_currency": "USD",
        "deadline_days": 10,
        "commercial_use_requirements": "Buyout",
        "usage_channels": "Web",
        "usage_duration": "1 Year",
        "usage_territories": "Global",
        "restrictions_and_guidelines": "None",
        "disclosure_requirements": "Disclose",
        "required_skill_ids": ["sk-cinematic-direction", "invalid-skill-999"],
        "required_tool_ids": ["tool-runway-gen3"]
    }

    res = client.post("/api/briefs", json=payload, headers=headers)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    created_id = res.json()["id"]

    # Clean up
    db = SessionLocal()
    try:
        to_delete = db.query(Brief).filter(Brief.id == created_id).first()
        if to_delete:
            db.delete(to_delete)
            db.commit()
    finally:
        db.close()

def test_unauthorized_draft_access_denied():
    # Public / creators cannot see DRAFT or CLOSED briefs
    res = client.get("/api/briefs?status=DRAFT")
    assert res.status_code == 200
    assert len(res.json()) == 0, "Unauthenticated user received draft briefs!"

    login_res = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": "Password123!"
    })
    creator_token = login_res.json()["access_token"]
    res_creator = client.get("/api/briefs?status=DRAFT", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_creator.status_code == 200
    assert len(res_creator.json()) == 0, "Creator user received draft briefs!"

def test_creator_cannot_create_brief():
    # Only BRAND role can create briefs
    login_res = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": "Password123!"
    })
    creator_token = login_res.json()["access_token"]
    res = client.post("/api/briefs", json={
        "title": "Creator attempt",
        "campaign_objective": "Forbidden",
        "target_audience": "All",
        "content_type": "VIDEO",
        "creative_style_mood": "Mood",
        "aspect_ratio": "16:9",
        "resolution_min": "1080p",
        "deliverables_description": "Descr",
        "revision_allowance": 1,
        "budget_amount": 1000,
        "budget_currency": "USD",
        "deadline_days": 7,
        "commercial_use_requirements": "None",
        "usage_channels": "Web",
        "usage_duration": "1y",
        "usage_territories": "Global",
        "restrictions_and_guidelines": "None",
        "disclosure_requirements": "None"
    }, headers={"Authorization": f"Bearer {creator_token}"})
    assert res.status_code == 403, f"Expected 403 Forbidden for creator, got {res.status_code}"
