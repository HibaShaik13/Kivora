# KIVORA — PHASE 5 MATCHING AND SCORING SPECIFICATION
## Explainable Creator-to-Brief Matching Engine & Scoring Framework

**Version:** 5.0.0  
**Status:** Approved & Implemented  
**Date:** October 13, 2026  
**System Boundary:** Deterministic Core Matching Engine (`backend/app/services/matching.py`)

---

## 1. Overview & Architectural Philosophy

The Kivora Matching Engine is built on three non-negotiable principles:
1. **Explainable & Deterministic Baseline**: The core matching calculation is 100% deterministic, transparent, and reproducible. A match score of 88% is derived from a calibrated mathematical formula rather than an opaque LLM hallucination.
2. **Strict Grounding in Audited Evidence**: Scores are computed exclusively from real database records (demonstrated skills, verified tool claims, portfolio project metadata, and commercial terms). Unverified claims are explicitly discounted; missing fields are penalised and noted.
3. **Clear Distinction Between Eligibility and Ranking**: Binary eligibility gates (hard filters) prevent mismatched engagements before soft weights calculate relative ranking.

---

## 2. Two-Phase Evaluation Architecture

```
[Campaign Brief] + [Creator Profile]
          │
          ▼
┌───────────────────────────────────────┐
│  PHASE 1: BINARY ELIGIBILITY GATES   │
│  - Content Type Feasibility           │
│  - Native Aspect Ratio Capability    │
│  - Budget Feasibility (≤ 1.15x limit) │
└───────────────────────────────────────┘
          │
     Passed? ──No──► Dampen Score (max 45%), Flag INCOMPATIBLE
          │
         Yes
          │
          ▼
┌───────────────────────────────────────┐
│  PHASE 2: WEIGHTED SOFT SCORING (100%)│
│  1. Skill Compatibility        (25%)  │
│  2. Portfolio Relevance        (25%)  │
│  3. Tool & Model Proficiency   (15%)  │
│  4. Domain & Format Affinity   (15%)  │
│  5. Budget Gradient Fit        (10%)  │
│  6. Verification Tier Status   (5%)   │
│  7. Real-Time Availability     (5%)   │
└───────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────┐
│  OUTPUT: EXPLAINABLE MATCH RESULT     │
│  - Total Score (0–100) & Match Level  │
│  - Sub-Score Breakdown Matrix         │
│  - Data Coverage & Confidence Score   │
│  - Structured Reasons & Gaps          │
│  - Relevant Portfolio References      │
└───────────────────────────────────────┘
```

---

## 3. Phase 1: Binary Eligibility Gates (Hard Filters)

Hard filters evaluate whether a creator is technically eligible to fulfill the minimum campaign requirements. If any hard filter fails, the creator's composite score is severely damped (`min(composite * 0.45, 45.0)`) and their status is marked `INCOMPATIBLE`, while full explanations of the blockers are retained.

| Gate | Condition | Rationale | Failure Result |
|---|---|---|---|
| **Content Type** | Creator must possess at least one portfolio project matching `brief.content_type`, or declare that content type in their primary specialization. | Avoids assigning video campaigns to still-image-only creators. | Hard failure; gaps list missing proven project. |
| **Aspect Ratio** | Creator portfolio must contain native aspect ratio samples (e.g. 9:16 vertical, 16:9 cinematic, 1:1 square). | Deliverable format compatibility. | Soft warning/gap noted if absent. |
| **Budget Ceiling** | Creator's minimum project budget (`min_budget`) must not exceed `brief.budget_amount * 1.15`. | Prevents unbridgeable financial expectations while allowing a 15% negotiation buffer. | Hard failure; flagged as budget incompatibility. |

---

## 4. Phase 2: Calibrated Soft Scoring Framework (Weights Total 100%)

The soft scoring model evaluates compatible creators along 7 dimensions. Weights strictly sum to **100%**:

| Criterion | Weight | Scoring Mechanism |
|---|---|---|
| **1. Skill Compatibility** | **25%** | Evaluates declared skills vs brief requirements. Weighted: `Required` = 2.0x, `Preferred` = 1.0x. Multipliers: `EXPERT` (1.0), `ADVANCED` (0.85), `INTERMEDIATE` (0.70), `BEGINNER` (0.50). |
| **2. Portfolio Relevance** | **25%** | Evaluates past deliverable evidence: content type match (+40 pts), aspect ratio match (+25 pts), creative keyword match in titles/tags (+25 pts), verified evidence records attached (+10 pts). Max 100 pts. Returns top matching project IDs. |
| **3. Tool Proficiency** | **15%** | Compares brief tools (e.g. Runway, ComfyUI, Flux) against creator stack. `Required` = 2.0x, `Preferred` = 1.0x. Multiplier: `1.0` if claim-verified with audit evidence, `0.85` if self-declared. |
| **4. Domain & Format Affinity** | **15%** | Blended score: 60% taxonomy match (direct category match = 100 pts, parent/child match = 80 pts, none = 45 pts) + 40% style keyword overlap with creator bio. |
| **5. Budget Compatibility** | **10%** | Continuous gradient: `100.0` if `creator.min_budget <= brief.budget`; linear decay from `100` down to `60` within 15% negotiation buffer; `20.0` if over ceiling; `75.0` if flexible/open. |
| **6. Verification & Evidence** | **5%** | Audited verification tier: `TOP_STUDIO` (100.0), `VERIFIED_PRO` (90.0), `COMMUNITY` (65.0), Unverified / None (40.0). |
| **7. Production Availability** | **5%** | Creator schedule status: `AVAILABLE` (100.0), `LIMITED` (60.0), `BOOKED` (20.0), Unknown (70.0). |

$$\text{Composite Score} = 0.25 S_{\text{skill}} + 0.25 S_{\text{portfolio}} + 0.15 S_{\text{tool}} + 0.15 S_{\text{style}} + 0.10 S_{\text{budget}} + 0.05 S_{\text{verification}} + 0.05 S_{\text{availability}}$$

---

## 5. Score Tiers & Interpretability

Scores are classified into standardized levels:
- **`PERFECT` (90.0% – 100.0%)**: Comprehensive mastery across required skills, verified tools, native aspect ratio portfolio samples, and within budget.
- **`EXCELLENT` (80.0% – 89.9%)**: Strong alignment with minor preferred criteria or non-critical format deviations.
- **`GOOD` (68.0% – 79.9%)**: Capable creator with solid fundamentals; may lack a specific secondary tool or verified audit record.
- **`PARTIAL` (46.0% – 67.9%)**: Baseline compatibility but notable skill gaps or higher rate thresholds.
- **`INCOMPATIBLE` (0.0% – 45.0%)**: Failed one or more binary eligibility gates.

> **Disclaimer Requirement**: All matching responses include the standard legal notice:
> *"Scores represent estimated compatibility based on declared and verified portfolio evidence, not a guarantee of outcome."*

---

## 6. Data Coverage & Confidence Metrics

To prevent missing data from being falsely interpreted as a perfect fit or quiet exclusion, the engine computes a **Data Coverage Index**:
$$\text{Data Coverage} = \frac{\sum \text{Populated Dimensions}}{\text{Total Required Dimensions (7)}} \times 100\%$$
Dimensions checked: `skills`, `tools`, `portfolio_projects`, `categories`, `min_budget`, `availability_status`, `verification_tier`.
This metric is displayed alongside the score, ensuring brands know whether an 85% match is backed by full evidence or limited declarations.

---

## 7. Structured Explainability Output

For every evaluation, the engine produces:
- `score`: Composite float between 0.0 and 100.0.
- `match_level`: Classification tier string.
- `breakdown`: Granular sub-scores for all 7 factors.
- `reasons`: Human-readable positive alignment bullets (e.g. *"Portfolio includes 3 verified VIDEO projects"*).
- `gaps`: Missing requirements and unfulfilled preferences (e.g. *"Missing required tool pipeline: 'tool-comfyui'"*).
- `warnings`: Advisory notes on budget thresholds or limited availability.
- `relevant_portfolio_projects`: Up to 4 structured project records (`id`, `title`, `content_type`, `aspect_ratio`, `thumbnail_url`).

---

## 8. Deterministic Ranking & Tie-Breaking

When sorting matching results:
1. `score` (Descending)
2. `confidence_score` / `data_coverage` (Descending)
3. `handle` (Ascending, lexicographical)

This ensures identical inputs always produce the identical ranking order across all query executions.
