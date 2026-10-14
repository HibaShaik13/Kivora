# Kivora — Final Visual Polish Image System Audit

**Date:** 2026-10-13  
**Status:** Audit Completed  
**Scope:** Review of image schemas, database records, creator avatars, brand identities, brief cover assets, upload pipelines, and UI presentation.

---

## 1. Executive Summary

A comprehensive audit of Kivora's visual asset system revealed key architectural gaps and asset deficiencies:
1. **Creator Avatar Duplication & Fragility:**
   - Out of 152 creators in the active database, 27 directly referenced `/assets/avatars/elena.jpg`.
   - 125 creators referenced external unsplash URLs (`https://images.unsplash.com/photo-1534528741776...`), which fail or return repetitive stock images.
   - Frontend components (`CreatorCard`, `CreatorProfileModal`, `MessagesInbox`) utilized hardcoded `onError` fallbacks directly pointing to `/assets/avatars/elena.jpg`, making dozens of distinct creators visually identical.
2. **Brand Imagery Lacks Industry-Relevant Cover Art:**
   - While 6 core brands possess clean vector logos (`lumina.svg`, `volt.svg`, `apex.svg`, `aurora.svg`, `zenith.svg`, `vitality.svg`), 27 brands had synthetic unsplash URLs.
   - Brands had no curated cover/product imagery representing their distinct industries (e.g. perfume & fragrance vs skincare vs automotive vs luxury fashion).
3. **Campaign Brief Reference Assets Not Displayed:**
   - The `Brief` model contains a `reference_asset_url` column (and serializer alias `cover_image_url`), but all 171 briefs in the database had `reference_asset_url = None`.
   - `BriefCard.jsx` cycled through only 6 hardcoded portfolio thumbnails when `cover_image_url` was missing.
   - `BriefDetailModal.jsx` completely omitted displaying campaign reference images or moodboard covers.
   - Saved Briefs and personalized recommendations lacked consistent brief cover presentation.
4. **Static Media Proxy Gap:**
   - Backend `main.py` serves uploaded files at `/uploads`, but `frontend/vite.config.js` only proxied `/api`, causing local `/uploads/...` URLs to fail in Vite dev mode.

---

## 2. Model & Schema Inventory

| Entity | Image Fields | Existing DB State | Required Polish |
|---|---|---|---|
| **CreatorProfile** | `avatar_url` (String(500)), `banner_url` (String(500)) | 152 creators; 27 duplicate Elena; 125 external unsplash URLs | Deterministic assignment of unique, high-resolution editorial portraits from a local curated library keyed by creator ID. File upload/change/remove in profile editor. |
| **BrandProfile** | `logo_url` (String(500)) | 33 brands; 6 SVG logos; 27 unsplash URLs | Industry-accurate logos and distinct cover/product imagery reflecting actual categories (skincare, automotive, fragrance, tech, fashion). |
| **Brief** | `reference_asset_url` (String(500)), `cover_image_url` alias | 171 briefs; all currently `None` | Persist reference images from creation through publishing; display on cards, detail modals, saved items, and recommendations. Provide category-authentic covers. |
| **PortfolioProject** | `primary_asset_url`, `thumbnail_url` | 6 projects with MP4/JPG thumbnails | Retain and ensure separation from creator profile avatars. |

---

## 3. UI Component Display Deficiencies

- `CreatorCard.jsx`: Hardcoded `avatarUrl` fallback to `elena.jpg` on `onError`.
- `CreatorProfileModal.jsx`: Hardcoded `avatarUrl` fallback to `elena.jpg` on `onError`.
- `EditCreatorProfileModal.jsx`: Only allowed text URL entry; lacked file upload with preview, change, and remove actions.
- `BriefCard.jsx`: Only checked `cover_image_url`, ignored `reference_asset_url`, and cycled 6 portfolio thumbnails.
- `BriefDetailModal.jsx`: Completely missing visual moodboard / campaign cover hero section.
- `CreateBriefModal.jsx`: Uploaded media properly to `/api/media/upload`, but dropped `reference_asset_url` during edit mode and lacked update persistence.

---

## 4. Next Implementation Steps (Phases B through J)

1. Build curated local asset libraries in `frontend/public/assets/`:
   - `creator-portraits/`: Unique, professional editorial portraits.
   - `brand-identities/`: Distinct brand logos and industry-relevant cover imagery.
   - `campaign-covers/`: Thematic campaign moodboards and cover artwork (skincare, fragrance, automotive, fashion, tech, 3D).
2. Configure `vite.config.js` to proxy `/uploads` to `http://localhost:8000`.
3. Update `BriefCard.jsx`, `BriefDetailModal.jsx`, `CreateBriefModal.jsx`, and `CreatorCard.jsx` to display authentic campaign references and unique portraits with resilient fallbacks.
4. Execute an idempotent backfill script mapping creator IDs and brand IDs to unique, local, high-fidelity assets.
5. Add automated tests verifying brief image persistence, unique creator portraits, and brand industry matching.
