# Kivora — Final Visual Polish Manual Verification Guide

**Date:** 2026-10-13  
**Target Environment:** `http://localhost:5173` (Frontend) & `http://localhost:8000` (FastAPI Backend)  
**Session Recording:** `visual_polish_verify_1791901588817.webp`  

---

## 1. Prerequisites & Starting State

Ensure both local dev servers are active:
- Backend: `uvicorn backend.app.main:app --reload --port 8000`
- Frontend: `npm run dev` (running in `frontend/` on port 5173)

Open Google Chrome or modern Chromium browser to `http://localhost:5173`.

---

## 2. Test Suite 1: Creator Portraits & Visual Uniqueness

### Step 1: Open Discover Creators Tab
1. In the top navigation bar, click **Discover Creators**.
2. Observe the grid of creator cards (e.g., Kenji Montague, Hassan Khalil, Sophia Al-Mansoor, Devon Vance, Chloe Dubois).

### Step 2: Compare 10+ Creator Cards for Portrait Uniqueness
1. Scroll down the creator roster.
2. Verify that creators have distinct, bespoke editorial portraits:
   - AI artists feature futuristic studio portraits with luminous ambient lighting.
   - Automotive visualists feature cinematic studio lighting and design accents.
   - Fashion creators feature luxury editorial styling.
   - Beauty filmmakers feature clean lighting and macro textures.
3. **Pass Criteria:** No creators share generic placeholder avatars, and `/assets/avatars/elena.jpg` is not assigned as a fallback across different creators.

### Step 3: Card-to-Modal Portrait Consistency
1. Click **View Profile** on Kenji Montague's card.
2. In the `CreatorProfileModal`, verify:
   - The large circular portrait matches the thumbnail shown on the card.
   - The image is crisp, properly framed, and not stretched or distorted.
   - The creator's portfolio project thumbnails below are visually distinct from the profile avatar.
3. Close the modal by clicking `✕`.

### Step 4: Profile Avatar Upload & Removal
1. Log in as a creator demo user (e.g. `elena.rostova@creator.demo` / `Password123!`).
2. Open **Creator Passport / Edit Profile**.
3. Under **Creator Profile Portrait / Avatar**, observe the circular photo preview.
4. Click **📷 Upload New Photo**, choose an image from your computer, and verify the preview updates immediately.
5. Click **Remove** to clear the image, then save.
6. Verify the profile gracefully resolves to the deterministic aesthetic portrait.

---

## 3. Test Suite 2: Brand Imagery & Industry Match

### Step 1: Inspect Skincare Brand (Lumina Skincare)
1. Navigate to briefs by **Lumina Skincare** (e.g., *Lumina Dewdrop Serum — Luxury Launch Commercial*).
2. Observe the brand logo in the upper corner of the card: displays `lumina.svg`.
3. Open the brief card to verify the cover art: displays clean cosmetic serum droplet imagery with soft luminous lighting.
4. Verify the brand name and verified commercial client badge remain legible and separated from the artwork.

### Step 2: Inspect Luxury Fragrance Brand (Aurora Fragrance)
1. Find a fragrance campaign brief (e.g., *Amber Caustics & Liquid Refraction Campaign*).
2. Verify the brand mark is `aurora.svg`.
3. Verify the visual moodboard displays a luxury glass perfume flacon with warm liquid reflections and editorial caustic lighting.

### Step 3: Inspect Automotive Brand (Apex Motors)
1. Find an automotive brief by **Apex Motors** (e.g., *Apex GT — Aerodynamic Hypercar Commercial*).
2. Verify the brand mark is `apex.svg`.
3. Verify the visual displays a high-performance vehicle in a darkened studio with dramatic aerodynamic rim lighting.

---

## 4. Test Suite 3: Campaign Brief Reference Asset Upload & Publication Flow

### Step 1: Log in as Brand & Launch Brief Builder
1. Click **Switch / Login** in the upper right.
2. Select **Lumina Skincare (Brand)** (`creative@luminaskincare.demo` / `Password123!`).
3. On the Brand Dashboard, click **Launch Campaign Brief**.

### Step 2: Upload Campaign Reference Moodboard Asset
1. Fill in required fields:
   - **Title:** `Lumina Midnight Botanical Launch`
   - **Campaign Objective:** `Cinematic commercial visual for nighttime botanical hydration launch.`
   - **Budget:** `$6,500 USD`
2. Scroll to **Campaign Reference Image / Moodboard Asset (Optional)**.
3. Click **📁 Upload Reference Image** and select a PNG/JPG moodboard image.
4. Verify:
   - An upload spinner appears briefly.
   - A thumbnail preview displays the uploaded image immediately.
   - A `Remove asset` link is available.

### Step 3: Save as Draft & Persistence Verification
1. Click **Save as Draft**.
2. Verify the brief closes with confirmation.
3. Under **My Drafts** on the Brand Dashboard, click on the draft brief.
4. **Pass Criteria:** The uploaded moodboard asset remains intact and visible in the preview.

### Step 4: Publish the Brief
1. In the brief editor, click **Publish Brief**.
2. Verify the brief transitions to `PUBLISHED` status.

### Step 5: Creator Discovery & Brief Card Display
1. Log out or switch to a Creator account (e.g., `elena.rostova@creator.demo`).
2. Navigate to **Explore Briefs**.
3. Locate the `Lumina Midnight Botanical Launch` card.
4. **Pass Criteria:**
   - The brief card's hero media displays the exact moodboard image uploaded during creation.
   - The format badge (`16:9 • VIDEO`), brand name (`Lumina Skincare`), and budget (`$6,500 USD`) remain crisp and legible.

### Step 6: Brief Detail Modal Inspection
1. Click on the brief card to open `BriefDetailModal`.
2. Inspect the **REFERENCE MOODBOARD & ASSET (BRAND UPLOAD)** section in the left specification column.
3. **Pass Criteria:**
   - Displays the uploaded high-resolution reference image with a purple `Verified Reference` badge.
   - The image is framed with `object-fit: contain` / `cover` without distortion or pixelation.

### Step 7: Saved Briefs Consistency
1. Click **Save Brief** (or the bookmark ribbon icon).
2. Navigate to **Saved Briefs** in the Creator Hub.
3. **Pass Criteria:** The saved brief card displays the exact same reference image.

### Step 8: Edit Brief Without Changing Image
1. Switch back to the Brand account and open the published brief.
2. Edit only the campaign description or budget (e.g., change budget to `$7,000 USD`).
3. Click **Save Changes**.
4. Reopen the brief.
5. **Pass Criteria:** The uploaded reference image remains preserved and was not erased or replaced with a generic fallback.
