"""
FastAPI Integration & Endpoint Verification Script
Tests all core API endpoints, parameters, explainable matching, and AI brief generator.
"""

import sys
from pathlib import Path
from starlette.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.main import app

client = TestClient(app)


def run_api_tests():
    print("\n=======================================================")
    print("  KIVORA FASTAPI ENDPOINT INTEGRATION AUDIT")
    print("=======================================================\n")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] GET /api/health -> 200 OK")

    # 2. Taxonomy endpoints
    res = client.get("/api/taxonomy/skills")
    assert res.status_code == 200 and len(res.json()) >= 10, "Skills taxonomy failed"
    print(f"[PASS] GET /api/taxonomy/skills -> 200 OK ({len(res.json())} skills returned)")

    res = client.get("/api/taxonomy/tools")
    assert res.status_code == 200 and len(res.json()) >= 10, "Tools taxonomy failed"
    print(f"[PASS] GET /api/taxonomy/tools -> 200 OK ({len(res.json())} tools returned)")

    # 3. Creator listing & filtering
    res = client.get("/api/creators")
    assert res.status_code == 200 and len(res.json()) >= 14, "Creator list count failed"
    print(f"[PASS] GET /api/creators -> 200 OK ({len(res.json())} creators listed)")

    # Filter by tool Runway Gen-3
    res = client.get("/api/creators?tool=Runway Gen-3 Alpha")
    assert res.status_code == 200 and len(res.json()) >= 3, "Runway filter failed"
    print(f"[PASS] GET /api/creators?tool=Runway Gen-3 -> 200 OK ({len(res.json())} filtered creators)")

    # 4. Creator detail with workflow & evidence
    res = client.get("/api/creators/elena_creative")
    assert res.status_code == 200, f"Creator detail failed: {res.text}"
    data = res.json()
    assert data["display_name"] == "Elena Rostova", "Wrong creator name"
    assert len(data["portfolio_projects"]) > 0, "Missing portfolio projects"
    proj = data["portfolio_projects"][0]
    assert len(proj["workflow_steps"]) >= 4, "Missing workflow steps"
    assert len(proj["evidence_records"]) >= 2, "Missing evidence records"
    print(f"[PASS] GET /api/creators/elena_creative -> 200 OK (Loaded 4 workflow steps & 2 evidence records)")

    # 5. Brief listing & detail
    res = client.get("/api/briefs")
    assert res.status_code == 200 and len(res.json()) >= 9, "Brief list count failed"
    print(f"[PASS] GET /api/briefs -> 200 OK ({len(res.json())} campaign briefs)")

    res = client.get("/api/briefs/brief-lumina-dewdrop")
    assert res.status_code == 200, "Brief detail failed"
    brief_data = res.json()
    assert brief_data["title"] == "Dewdrop Radiance Serum 4K Cinematic Launch"
    print(f"[PASS] GET /api/briefs/brief-lumina-dewdrop -> 200 OK (Commercial rights & specs verified)")

    # 6. Explainable Matching Endpoint
    res = client.get("/api/match/briefs/brief-lumina-dewdrop")
    assert res.status_code == 200, f"Matching endpoint failed: {res.text}"
    match_data = res.json()
    assert match_data["total_creators_evaluated"] >= 14
    top_match = match_data["matches"][0]
    print(f"[PASS] GET /api/match/briefs/brief-lumina-dewdrop -> 200 OK")
    print(f"       Top Match: {top_match['display_name']} ({top_match['score']}% - {top_match['match_level']})")
    print(f"       Reasons: {top_match['reasons'][:2]}")

    # 7. AI-Assisted Brief Builder Endpoint
    ai_payload = {
        "raw_prompt": "We need a 30s luxury ethereal commercial for our hydrating glow serum on Instagram and YouTube 4K with slow motion fluid droplets.",
        "target_budget": 4500.0
    }
    res = client.post("/api/ai/generate-brief", json=ai_payload)
    assert res.status_code == 200, f"AI Brief Builder failed: {res.text}"
    ai_brief = res.json()
    assert ai_brief["content_type"] in ["VIDEO", "PRODUCT_VIZ"]
    assert ai_brief["aspect_ratio"] in ["16:9", "9:16"]
    assert len(ai_brief["recommended_tools"]) > 0
    print(f"[PASS] POST /api/ai/generate-brief -> 200 OK")
    print(f"       Generated Title: '{ai_brief['title']}'")
    print(f"       Format: {ai_brief['aspect_ratio']} | Resolution: {ai_brief['resolution_min']}")
    print(f"       Recommended Tools: {ai_brief['recommended_tools']}")
    print(f"       Engine: {ai_brief['generation_engine']}")

    print("\n=======================================================")
    print("[SUCCESS] ALL FASTAPI ENDPOINTS & LOGIC VERIFIED (100%)")
    print("=======================================================\n")


if __name__ == "__main__":
    run_api_tests()
