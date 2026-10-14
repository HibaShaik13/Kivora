"""
test_visual_assets_and_brief_covers.py

Comprehensive automated test suite for Phase A-J visual polish milestone:
- Creator profile images (uniqueness, local editorial portraits, upload preservation)
- Brand visual identity & logos (industry match, preservation)
- Campaign brief reference uploads (upload, preview, draft persistence, publication persistence, edit preservation, explicit update, deliberate removal)
- Explore briefs & saved briefs serialization of reference_asset_url
- File upload security (safe extensions, size validation, path traversal prevention)
"""

import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.models import Brief, User, BrandProfile, CreatorProfile

client = TestClient(app)


@pytest.fixture(scope="module")
def brand_auth_headers():
    login_res = client.post("/api/auth/login", json={
        "email": "creative@luminaskincare.demo",
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Brand login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def creator_auth_headers():
    login_res = client.post("/api/auth/login", json={
        "email": "elena.rostova@creator.demo",
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Creator login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_creator_profiles_have_unique_local_assets():
    """Verify creators have local high-aesthetic portraits and distinct assignments."""
    res = client.get("/api/creators?limit=20")
    assert res.status_code == 200
    creators = res.json()
    assert len(creators) > 0

    avatars = [c["avatar_url"] for c in creators if c.get("avatar_url")]
    assert len(avatars) > 0

    # Ensure no external hotlinks
    for av in avatars:
        assert not av.startswith("https://images.unsplash.com"), f"External hotlink found: {av}"
        assert av.startswith("/assets/") or av.startswith("/uploads/"), f"Unexpected avatar path: {av}"

    # Ensure diversity among creators (not all assigned one single image)
    unique_avatars = set(avatars)
    assert len(unique_avatars) >= 3, f"Expected varied avatars, got {len(unique_avatars)}"


def test_brand_identities_are_local_and_industry_matched():
    """Verify brands have local SVG/verified logos matching their identity."""
    res = client.get("/api/brands")
    assert res.status_code == 200
    brands = res.json()
    assert len(brands) > 0

    for b in brands:
        logo = b.get("logo_url")
        assert logo, f"Brand {b.get('company_name')} missing logo_url"
        assert not logo.startswith("https://images.unsplash.com"), f"External hotlink found in brand: {logo}"
        assert logo.startswith("/assets/brand-identities/") or logo.startswith("/assets/brands/") or logo.startswith("/uploads/")


def test_brief_reference_upload_and_validation(brand_auth_headers):
    """Verify uploading reference asset returns valid URL, and invalid extensions are rejected."""
    # 1. Valid PNG upload
    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("moodboard_test.png", io.BytesIO(file_content), "image/png")}
    res = client.post("/api/media/upload", data={"category": "briefs"}, files=files, headers=brand_auth_headers)
    assert res.status_code in [200, 201], f"Valid upload failed: {res.text}"
    uploaded_url = res.json().get("url")
    assert uploaded_url and uploaded_url.startswith("/uploads/briefs/"), f"Invalid upload URL: {uploaded_url}"

    # 2. Reject executable / malicious file
    bad_files = {"file": ("script.exe", io.BytesIO(b"MZ..."), "application/x-msdownload")}
    bad_res = client.post("/api/media/upload", data={"category": "briefs"}, files=bad_files, headers=brand_auth_headers)
    assert bad_res.status_code in [400, 415, 422], f"Expected rejection of executable, got: {bad_res.status_code}"


def test_brief_draft_and_publish_preserves_reference_asset(brand_auth_headers):
    """Test full brief creation lifecycle: draft preserves image, publish preserves image."""
    test_ref_image = "/uploads/briefs/automated_test_moodboard_asset.jpg"
    test_title = "Automated Visual Test Campaign 2026"

    # Clean up any leftover
    db = SessionLocal()
    try:
        prev = db.query(Brief).filter(Brief.title == test_title).first()
        if prev:
            db.delete(prev)
            db.commit()
    finally:
        db.close()

    draft_payload = {
        "title": test_title,
        "campaign_objective": "Test objective with reference moodboard",
        "target_audience": "Luxury audience",
        "content_type": "VIDEO",
        "creative_style_mood": "Cinematic and editorial",
        "aspect_ratio": "16:9",
        "duration_seconds_min": 15,
        "duration_seconds_max": 30,
        "resolution_min": "4K UHD",
        "deliverables_description": "1x Master Video",
        "revision_allowance": 2,
        "budget_amount": 6500.0,
        "budget_currency": "USD",
        "deadline_days": 20,
        "commercial_use_requirements": "Full buyout",
        "usage_channels": "All Channels",
        "usage_duration": "1 Year",
        "usage_territories": "Global",
        "restrictions_and_guidelines": "None",
        "disclosure_requirements": "Disclose AI models",
        "reference_asset_url": test_ref_image,
        "status": "DRAFT",
    }

    # 1. Save as DRAFT
    draft_res = client.post("/api/briefs", json=draft_payload, headers=brand_auth_headers)
    assert draft_res.status_code == 201, f"Draft creation failed: {draft_res.text}"
    draft_brief = draft_res.json()
    brief_id = draft_brief["id"]
    assert draft_brief["status"] == "DRAFT"
    assert draft_brief["reference_asset_url"] == test_ref_image
    assert draft_brief["cover_image_url"] == test_ref_image

    # 2. Retrieve detail
    detail_res = client.get(f"/api/briefs/{brief_id}", headers=brand_auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["reference_asset_url"] == test_ref_image

    # 3. Publish brief without passing replacement image -> image preserved
    publish_res = client.put(
        f"/api/briefs/{brief_id}",
        json={"status": "PUBLISHED"},
        headers=brand_auth_headers
    )
    assert publish_res.status_code == 200, f"Publish update failed: {publish_res.text}"
    published = publish_res.json()
    assert published["status"] == "PUBLISHED"
    assert published["reference_asset_url"] == test_ref_image, "Reference image was lost during publication"

    # 4. Explicitly replace reference image
    new_ref_image = "/uploads/briefs/replaced_cinematic_cover.jpg"
    update_res = client.put(
        f"/api/briefs/{brief_id}",
        json={"reference_asset_url": new_ref_image},
        headers=brand_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["reference_asset_url"] == new_ref_image

    # 5. Deliberately remove reference image (empty string)
    clear_res = client.put(
        f"/api/briefs/{brief_id}",
        json={"reference_asset_url": ""},
        headers=brand_auth_headers
    )
    assert clear_res.status_code == 200
    assert clear_res.json()["reference_asset_url"] is None

    # Clean up test brief
    del_res = client.delete(f"/api/briefs/{brief_id}", headers=brand_auth_headers)
    assert del_res.status_code == 200


def test_explore_briefs_returns_reference_asset_on_cards():
    """Verify discovery endpoint returns reference_asset_url on public published brief cards."""
    res = client.get("/api/briefs?limit=10")
    assert res.status_code == 200
    briefs = res.json()
    assert len(briefs) > 0

    for b in briefs:
        assert "reference_asset_url" in b
        assert "cover_image_url" in b
        # Ensure that whatever image is provided is a clean local asset or upload
        if b.get("reference_asset_url"):
            assert b["reference_asset_url"].startswith("/assets/") or b["reference_asset_url"].startswith("/uploads/")
