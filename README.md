# Kivora — AI Content Creator Marketplace
> **ByteXL HacXLerate 2026 Hackathon | Kampus.VC Problem Statement**  
> *Phase 0: Problem Understanding, Data Design, and Connected Demo Data Foundation*

---

## 🌟 Executive Summary

**Kivora** is an AI-native creative marketplace designed to eliminate the trust deficit in generative production. Unlike traditional freelance platforms, Kivora evaluates creators through **reproducible multi-step production pipelines**, **audited evidence artifacts** (ComfyUI node graphs, intermediate passes, camera trajectory logs), and **commercial IP compliance**, paired with an **AI-Assisted Brief Builder** and an **explainable matching engine**.

---

## 📁 Repository Structure (Phase 0)

```
Kivora/
├── README.md                                 # Overview, setup, and inspection guide
├── kivora.db                                 # Seeded SQLite relational database
├── docs/
│   └── PHASE_0_PLANNING_AND_SPECIFICATION.md # Full 10-section architecture & specification
└── backend/
    ├── app/
    │   ├── __init__.py
    │   ├── database.py                       # SQLAlchemy 2.0 engine & session factory
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── models.py                     # Normalized relational models
    │   └── data/
    │       └── seed_data.json                # Reproducible seed dataset
    └── scripts/
        ├── __init__.py
        ├── generate_seed_json.py             # Seed dataset generator script
        ├── seed_db.py                        # Database loader & table builder
        └── validate_seed.py                  # Foreign key auditor & scenario validator
```

---

## 📊 Connected Seed Dataset Highlights

The seeded data (`backend/app/data/seed_data.json` & `kivora.db`) is strictly normalized and cross-referenced:

| Entity | Count | Highlights / Scope |
| :--- | :---: | :--- |
| **Users** | 20 | 14 Creators + 6 Brands with distinct authentication records |
| **Creator Profiles** | 14 | Spans Filmmaking, 3D Product Viz, Anime, High-Fashion, CGI Automotive, Concept Art, Audio-Visuals |
| **Brand Profiles** | 6 | Luxury Cosmetics, EV Automotive, AAA/Indie Gaming, Digital Fashion, FinTech, Bio-Wellness |
| **Skills Catalog** | 12 | LoRA Character Consistency, 4K Upscaling, Camera Control, Fluid Dynamics, etc. |
| **Tools Catalog** | 12 | Runway Gen-3, Midjourney v6, ComfyUI, Flux.1 Pro, Kling 1.5, Magnific AI, ElevenLabs, etc. |
| **Creator Skills & Tools** | 84 | Links with skill proficiencies and verified vs. self-declared status flags |
| **Campaign Briefs** | 9 | Varied aspect ratios (16:9, 9:16, 1:1), 4K video specs, commercial rights, budgets ($1.5k–$6.5k) |
| **Portfolio Projects** | 6 | Detailed deep-dives with aspect ratios, resolutions, and licensing tiers |
| **Workflow Steps** | 14 | Sequential production pipelines (Prompting $\rightarrow$ ControlNet $\rightarrow$ Motion $\rightarrow$ Upscaling) |
| **Evidence & Verifications**| 14 | ComfyUI node graphs, process screenshots, prompt logs, with reviewer audit notes |
| **Applications** | 6 | Real pitches connected to live briefs with attached portfolio pieces |
| **Engagements** | 3 | Active production pipelines (`KICKOFF`, `DRAFT_SUBMITTED`, `FINAL_APPROVED`) |

---

## 🚀 Quickstart & Verification

### 1. Prerequisites
- Python 3.10+
- SQLAlchemy, Pydantic

### 2. Inspect Seed Data
The complete dataset is formatted in human-readable JSON:
```bash
cat backend/app/data/seed_data.json
```

### 3. Re-seed the Database (Idempotent)
Drops and regenerates all relational tables in `kivora.db`:
```bash
python backend/scripts/seed_db.py
```

### 4. Run Automated Validation & Filter Scenarios
Validates SQLite foreign key integrity and runs 6 evaluation scenarios:
```bash
python backend/scripts/validate_seed.py
```

### 5. Run FastAPI Endpoint Integration Audit
Tests all REST endpoints, filter parameters, explainable matching, and the AI brief builder:
```bash
python backend/scripts/test_api_endpoints.py
```

### 6. Start the FastAPI Development Server
```bash
uvicorn backend.app.main:app --reload --port 8000
```
Interactive API documentation will be available at: `http://localhost:8000/docs`

### Validation Scenarios Tested:
1. **Strong Match:** Elena Rostova (`creator-elena-rostova`) on Lumina Skincare 4K Video brief (16:9, Runway Gen-3 verified, within budget).
2. **Partial Match:** Marcus Vance (`creator-marcus-vance`) matches budget and aesthetic but lacks required video motion generation.
3. **Hard Filter Exclusion:** Kai Tanaka (`creator-kai-tanaka`) fails hard requirement on 4K fluid video synthesis.
4. **Legitimate Zero-Result Search:** Querying for an incompatible combination (e.g., 1:1 Audio-Visual video under $200) cleanly returns 0 results.
5. **Commercial License Diversity:** Verifies distinct licensing tiers (`Full Commercial Buyout`, `Worldwide Perpetual`, `Non-Exclusive Digital Rights`).
6. **Verification Spectrum:** Proves distinction between self-declared tools (13 claims) and evidence-audited tools (30 claims with reviewer notes).

---

## 📑 Documentation Links
- Detailed Specification: [`docs/PHASE_0_PLANNING_AND_SPECIFICATION.md`](file:///c:/Users/muska/OneDrive/Desktop/Kivora/docs/PHASE_0_PLANNING_AND_SPECIFICATION.md)
- Data Models: [`backend/app/models/models.py`](file:///c:/Users/muska/OneDrive/Desktop/Kivora/backend/app/models/models.py)
- Seed Loader: [`backend/scripts/seed_db.py`](file:///c:/Users/muska/OneDrive/Desktop/Kivora/backend/scripts/seed_db.py)
