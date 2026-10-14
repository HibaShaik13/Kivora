# Kivora — Image Asset Manifest & Library Catalog

**Date:** 2026-10-13  
**Status:** Curated, Localized & Active  
**Directory Root:** `frontend/public/assets/` & Backend Static Mount `/assets/`  

---

## 1. Directory Structure

```
frontend/public/assets/
├── creator-portraits/        # Distinct editorial creator portraits (19 assets)
├── brand-identities/         # Vector brand logos and commercial marks (6 assets)
├── brand-product-imagery/    # Industry-accurate product hero covers (8 assets)
├── campaign-covers/          # High-resolution commercial brief covers (15 assets)
├── campaign-moodboards/      # Campaign moodboard references & assets
└── fallbacks/                # Resilient UI fallbacks for offline / missing items (7 assets)
```

---

## 2. Creator Portraits Library (`/assets/creator-portraits/`)

| File Name | Specialization / Aesthetic | Resolution | Prompt / Creative Direction |
|---|---|---|---|
| `portrait_ai_artist.jpg` | Generative Visual Artist | 1024x1024 (1:1) | Editorial studio portrait, luminous purple/amber neon lighting, holographic visor detail, serene focused gaze |
| `portrait_fashion_creator.jpg` | Luxury Fashion & Runway Director | 1024x1024 (1:1) | High-fashion editorial photography, sculpted linen styling, warm ivory background, natural skin texture |
| `portrait_automotive_designer.jpg` | Automotive & Industrial CGI | 1024x1024 (1:1) | Cinematic design studio, subtle aerodynamic vehicle clay model in background, dramatic rim lighting |
| `portrait_cgi_artist.jpg` | 3D Simulation & VFX Visualist | 1024x1024 (1:1) | High-end workstation environment, iridescent ambient lighting, modern minimalist aesthetic |
| `portrait_beauty_filmmaker.jpg` | Beauty & Macro Fluid Cinematographer | 1024x1024 (1:1) | Macro lighting, clean beauty editorial portrait, soft luminous dawn reflections |
| `alex.jpg` | Creative Technologist & Director | 768x768 (1:1) | Natural warm ambient studio, professional creative portrait |
| `ananya.jpg` | Spatial Design & Architecture Artist | 768x768 (1:1) | Clean architectural lines, modern studio, elegant styling |
| `chloe.jpg` | Editorial Motion Designer | 768x768 (1:1) | Contemporary portrait, muted pastel tones, confident composition |
| `devon.jpg` | Generative Video Director | 768x768 (1:1) | Cinematic backlight, professional production studio setting |
| `elena.jpg` | Cinematic AI Film Director (Elena Rostova) | 768x768 (1:1) | Editorial portrait, sophisticated ivory background, purple accent lighting |
| `hassan.jpg` | Automotive Commercial Director | 768x768 (1:1) | Studio rim lighting, focused expression, cinematic framing |
| `kai.jpg` | Stylized Animation & Anime Director | 768x768 (1:1) | Neon atmospheric studio, artistic creative wardrobe |
| `liam.jpg` | Sound & Multimodal Experience Designer | 768x768 (1:1) | Atmospheric acoustic recording studio, subtle soundboard background |
| `marcus.jpg` | Macro Fluid & Materials Specialist | 768x768 (1:1) | High-detail studio portrait, soft key light |
| `maya.jpg` | Fashion & Digital Textile Visualist | 768x768 (1:1) | Elegant fabric textures, high-fashion styling |
| `nora.jpg` | Documentary & Brand Storyteller | 768x768 (1:1) | Natural daylight portrait, authentic clean finish |
| `sophia.jpg` | Cellular & Organic Visual Effects | 768x768 (1:1) | Clean beauty editorial portrait, luminous highlights |
| `tariq.jpg` | XR & Interactive Real-Time Creator | 768x768 (1:1) | Precision studio lighting, technological design ambiance |
| `zara.jpg` | Commercial Brand Identity Director | 768x768 (1:1) | Refined executive-creative portrait, sophisticated composition |

---

## 3. Brand Identities & Product Hero Artwork

### Vector Logos (`/assets/brand-identities/`)
- `lumina.svg` — Lumina Skincare & Beauty
- `aurora.svg` — Aurora Fragrance & Luxury Perfumes
- `apex.svg` — Apex Motors & High-Performance Automotive
- `volt.svg` — Volt Audio, Acoustics & Consumer Tech
- `zenith.svg` — Zenith Gaming & Interactive Entertainment
- `vitality.svg` — Vitality Health, Organic Wellness & Beverages

### Category Hero Covers (`/assets/brand-product-imagery/` & `/assets/campaign-covers/`)

| Asset | Target Category | Creative Composition |
|---|---|---|
| `brand_skincare_cover.jpg` | Skincare & Cosmetics | Minimalist glass serum dropper bottle, translucent dew droplets, clean botanical surface, soft dawn light |
| `brand_fragrance_cover.jpg` | Luxury Fragrance & Scent | Sculpted amber glass perfume flacon, liquid refraction caustics, dramatic black-and-gold editorial reflections |
| `brand_automotive_cover.jpg` | Automotive & Hypercars | Futuristic aerodynamic electric hypercar in darkened minimalist showroom, sculpted rim reflections |
| `brand_fashion_cover.jpg` | Luxury Fashion & Apparel | Avant-garde couture model in iridescent pleated silk organza, high-fashion architectural studio |
| `brand_technology_cover.jpg` | Consumer Electronics & Audio | Precision aluminum audiophile headphones and minimalist titanium amplifier on walnut wood |
| `brand_gaming_cover.jpg` | Gaming & Virtual Production | Stylized cyber samurai in rainy neo-Tokyo street with glowing katana trails, anime cel-shaded lighting |
| `brand_beverage_cover.jpg` | Wellness & Botanical Drinks | Cold brew infused botanical elixir in frosted glass, citrus botanicals, morning sunlight reflections |
| `brand_architecture_cover.jpg` | Spatial Design & 3D Sets | Minimalist concrete and warm oak pavilion interior with floor-to-ceiling glass and soft daylight |

---

## 4. Deterministic Asset Resolution Strategy

The resolver algorithm in `frontend/src/utils/visualAssetHelpers.js` uses deterministic string hashing:

1. **User Upload Precedence:** Valid user uploads (`/uploads/...`) always take precedence.
2. **Stable Database ID Hashing:** When an asset is generated or backfilled, the hash is computed as:
   ```javascript
   const seed = creator.id || creator.handle;
   const portraitIndex = hashString(seed) % CURATED_CREATOR_PORTRAITS.length;
   ```
3. **Reproducibility Guarantee:** Any creator with database ID `creator-xxxx` will consistently resolve to the exact same portrait across all devices, sessions, and page reloads.
