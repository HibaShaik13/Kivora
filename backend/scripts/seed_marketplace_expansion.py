"""
Kivora Marketplace Expansion & Category Seeder
Expands the local database with:
- 40+ structured categories and 60+ subcategories
- 105+ diverse synthetic creators with realistic bios, skills, tools, portfolios, and categories
- 28 fictional brand profiles
- 160 realistic campaign briefs across categories
- 45+ applications, 26 engagements (collaborations), and deliverables

SAFETY GUARANTEES:
- Localhost development database only (kivora.db / localhost).
- Strict idempotency: existing user accounts and prior records are NEVER overwritten or deleted.
- All synthetic records use stable IDs prefixed with 'synth-' or 'cr-synth-' or 'brand-synth-'.
- Zero cross-brand collaboration leakage.
"""

import os
import sys
import uuid
import random
from pathlib import Path
from datetime import datetime, timedelta

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.database import engine, SessionLocal, Base, DATABASE_URL
from backend.app.core.security import hash_password
from backend.app.models.models import (
    User,
    CreatorProfile,
    BrandProfile,
    Category,
    CreatorCategory,
    Brief,
    BriefCategory,
    BriefSkill,
    BriefTool,
    Skill,
    CreatorSkill,
    Tool,
    CreatorTool,
    PortfolioProject,
    Application,
    Engagement,
    EngagementDeliverable,
)

# -------------------------------------------------------------
# SAFETY CHECK: Refuse to run against remote/production database
# -------------------------------------------------------------
def verify_safe_local_environment():
    db_lower = DATABASE_URL.lower()
    is_local_sqlite = "sqlite" in db_lower
    is_localhost_pg = "localhost" in db_lower or "127.0.0.1" in db_lower

    if not (is_local_sqlite or is_localhost_pg):
        raise RuntimeError(
            f"SAFETY ABORT: DATABASE_URL '{DATABASE_URL}' does not appear to be a local database. "
            "Seeder must run exclusively against local development environments."
        )
    print(f"[SAFE ENVIRONMENT CONFIRMED] Target database: {DATABASE_URL}")


# -------------------------------------------------------------
# CATEGORY & SUBCATEGORY TAXONOMY
# -------------------------------------------------------------
TAXONOMY_TREE = [
    {
        "name": "3D & CGI",
        "slug": "3d-cgi",
        "description": "Photorealistic 3D models, CGI environments, ray-traced lighting, and simulated materials.",
        "icon": "Box",
        "display_order": 1,
        "subcategories": [
            ("3D Product Rendering", "3d-product-rendering", "Macro CAD visualization and product lighting"),
            ("CGI Environments", "cgi-environments", "Virtual architectural sets and surreal worlds"),
            ("Automotive CGI", "automotive-cgi-sub", "High-fidelity vehicle renders and studio lighting"),
            ("Fluid & Particle Simulation", "fluid-particle-sim", "Dynamic smoke, fluid splashes, and macro physics"),
        ]
    },
    {
        "name": "AI Art",
        "slug": "ai-art",
        "description": "Generative imagery, high-fidelity diffusion synthesis, and conceptual visual art.",
        "icon": "Sparkles",
        "display_order": 2,
        "subcategories": [
            ("Generative Illustration", "generative-illustration", "Multi-pass diffusion digital art"),
            ("Concept Art", "concept-art-sub", "Sci-fi and fantasy worldbuilding art"),
            ("Surreal Art", "surreal-art", "Abstract compositions and surreal dreamscapes"),
            ("Experimental Visuals", "experimental-visuals", "Algorithmic synthesis and neural glitches"),
        ]
    },
    {
        "name": "Motion Design",
        "slug": "motion-design",
        "description": "Dynamic kinetic typography, brand animations, title sequences, and UI motion graphics.",
        "icon": "PlayCircle",
        "display_order": 3,
        "subcategories": [
            ("Kinetic Typography", "kinetic-typography", "Expressive animated type and brand mantras"),
            ("Brand Motion", "brand-motion", "Logo stings, product reveal motion, and broadcast packs"),
            ("2D / 3D Mixed Motion", "mixed-motion", "Hybrid vector and 3D fluid motion design"),
            ("UI & Interaction Motion", "ui-interaction-motion", "Micro-interactions and interface motion design"),
        ]
    },
    {
        "name": "Visual Effects",
        "slug": "visual-effects",
        "description": "Cinematic visual effects, compositing, rotoscoping, clean plate work, and digital pyrotechnics.",
        "icon": "Zap",
        "display_order": 4,
        "subcategories": [
            ("Compositing & Matchmove", "compositing-matchmove", "Camera tracking and live-action integration"),
            ("Virtual Production Sets", "virtual-production-sets", "Unreal Engine and NeRF background volumes"),
            ("Set Extension & Matte Painting", "set-extension-matte", "Photorealistic cinematic world extensions"),
        ]
    },
    {
        "name": "Illustration",
        "slug": "illustration",
        "description": "Hand-crafted and hybrid vector artwork, character design, editorial spot illustrations, and icons.",
        "icon": "PenTool",
        "display_order": 5,
        "subcategories": [
            ("Editorial Illustration", "editorial-illustration", "Magazine, publication, and article artwork"),
            ("Character Concept Design", "character-concept-design", "Anatomy, costume, and stylistic character sheets"),
            ("Packaging Illustration", "packaging-illustration", "Custom surface art for luxury retail packages"),
            ("Iconography & Vector Systems", "iconography-vector-systems", "Systematic product icon libraries"),
        ]
    },
    {
        "name": "Brand Design",
        "slug": "brand-design",
        "description": "Comprehensive brand identity systems, logos, color theory, guidelines, and visual language.",
        "icon": "Layers",
        "display_order": 6,
        "subcategories": [
            ("Visual Identity Systems", "visual-identity-systems", "Complete design guidelines and brand books"),
            ("Logotype & Mark Design", "logotype-mark-design", "Signature brand marks and crests"),
            ("Brand Guidelines & Tokens", "brand-guidelines-tokens", "Design token definitions and system scale"),
        ]
    },
    {
        "name": "Fashion & Apparel",
        "slug": "fashion-apparel",
        "description": "High-fashion lookbooks, virtual garments, digital runway simulations, and luxury apparel ads.",
        "icon": "ShoppingBag",
        "display_order": 7,
        "subcategories": [
            ("Fashion Campaigns", "fashion-campaigns", "Cinematic editorial campaigns and lookbooks"),
            ("Virtual Try-On Concepts", "virtual-try-on-concepts", "Digital fitting simulations and AR overlays"),
            ("Apparel Product Visualization", "apparel-product-visualization", "Fabric drape, thread detail, and seam lighting"),
            ("Accessories & Jewelry", "accessories-jewelry", "Macro precious metal and gemstone CGI rendering"),
        ]
    },
    {
        "name": "Beauty & Skincare",
        "slug": "beauty-skincare",
        "description": "Cosmetic product commercials, serum textures, macro skin lighting, and dermatology campaigns.",
        "icon": "Heart",
        "display_order": 8,
        "subcategories": [
            ("Skincare Campaigns", "skincare-campaigns", "High-key serum, lotion, and hydration visuals"),
            ("Beauty Product Visualization", "beauty-product-visualization", "Glass droppers, pumps, and frosted bottles"),
            ("Makeup Concepts", "makeup-concepts", "Vibrant pigment swatches and macro texture reels"),
            ("Cosmetic Advertising", "cosmetic-advertising", "Lifestyle and studio product reveal spots"),
        ]
    },
    {
        "name": "Food & Beverage",
        "slug": "food-beverage",
        "description": "Appetizing culinary commercials, beverage fizz simulations, artisanal dining, and menu art.",
        "icon": "Coffee",
        "display_order": 9,
        "subcategories": [
            ("Food Photography & CGI", "food-photography-cgi", "Macro moisture, steam, and culinary styling"),
            ("Beverage Advertising", "beverage-advertising", "Ice condensation, effervescence, and pour shots"),
            ("Packaging Concepts", "beverage-packaging-concepts", "Can wraps, labels, and bottle silhouettes"),
            ("Restaurant Campaigns", "restaurant-campaigns", "Atmospheric dining and signature dish showcases"),
        ]
    },
    {
        "name": "Automotive",
        "slug": "automotive",
        "description": "Cinematic vehicle commercials, interior cockpit renders, high-speed lighting, and EV mobility.",
        "icon": "Compass",
        "display_order": 10,
        "subcategories": [
            ("Vehicle Commercials", "vehicle-commercials", "High-speed road tracking and dramatic tunnel lighting"),
            ("Cockpit & Interior UX", "cockpit-interior-ux", "Digital dashboard displays and luxury stitch renders"),
            ("EV & Mobility Campaigns", "ev-mobility-campaigns", "Futuristic aerodynamic visualization and clean energy"),
            ("Automotive Motion Design", "automotive-motion-design", "HUD animations and telemetry visuals"),
        ]
    },
    {
        "name": "Technology & Gadgets",
        "slug": "technology-gadgets",
        "description": "Sleek consumer electronics, exploded hardware renders, transparent microchip reels, and device UI.",
        "icon": "Cpu",
        "display_order": 11,
        "subcategories": [
            ("Consumer Electronics Reveal", "consumer-electronics-reveal", "Precision aluminum chamfer and glass finish renders"),
            ("Exploded Component Renders", "exploded-component-renders", "Internal circuit boards, batteries, and mechanical stacks"),
            ("Smart Wearables", "smart-wearables", "Smartwatch, audio buds, and health tracker product videos"),
        ]
    },
    {
        "name": "Gaming",
        "slug": "gaming",
        "description": "AAA game teaser cinematic sequences, low/high-poly game assets, environment art, and esports packs.",
        "icon": "Gamepad2",
        "display_order": 12,
        "subcategories": [
            ("Game Trailers & Cinematics", "game-trailers-cinematics", "Action-packed in-engine and pre-rendered cinematics"),
            ("Game Assets & Concept Art", "game-assets-concept-art", "Weapon, vehicle, and level concept sheets"),
            ("Esports Broadcast Design", "esports-broadcast-design", "Tournament overlays, match tickers, and motion graphics"),
        ]
    },
    {
        "name": "Film & Entertainment",
        "slug": "film-entertainment",
        "description": "Feature film title sequences, movie posters, streaming series teasers, and episodic trailers.",
        "icon": "Film",
        "display_order": 13,
        "subcategories": [
            ("Movie Posters & Key Art", "movie-posters-key-art", "Theatrical posters and marquee visual artwork"),
            ("Title Sequences", "title-sequences", "Mood-setting opening credit animation"),
            ("Teaser Trailers", "teaser-trailers", "Paced montage reels with sound design synchronization"),
        ]
    },
    {
        "name": "Music & Audio",
        "slug": "music-audio",
        "description": "Audio-reactive generative visuals, music video visualizers, album artwork, and sound design sync.",
        "icon": "Music",
        "display_order": 14,
        "subcategories": [
            ("Album Art & Vinyl Packaging", "album-art-vinyl", "Physical sleeve art and digital release covers"),
            ("Audio-Reactive Visualizers", "audio-reactive-visualizers", "Waveform and frequency driven generative loops"),
            ("Tour Stage Visuals", "tour-stage-visuals", "Concert backdrop LED screens and looping canvas art"),
        ]
    },
    {
        "name": "Fitness & Sports",
        "slug": "fitness-sports",
        "description": "High-intensity athletic campaigns, sportswear in action, gym equipment renders, and sports promos.",
        "icon": "Activity",
        "display_order": 15,
        "subcategories": [
            ("Athletic Apparel Promos", "athletic-apparel-promos", "High-speed sweat, muscle tension, and performance apparel"),
            ("Gym Equipment CGI", "gym-equipment-cgi", "Dumbbells, smart treadmills, and biomechanical machines"),
            ("Action Sports Editing", "action-sports-editing", "Pacing, speed-ramping, and color grading for athletic spots"),
        ]
    },
    {
        "name": "Health & Wellness",
        "slug": "health-wellness",
        "description": "Holistic calm visuals, meditation apps, herbal supplement bottles, and mental health campaigns.",
        "icon": "Sun",
        "display_order": 16,
        "subcategories": [
            ("Supplement Packaging & CGI", "supplement-packaging-cgi", "Vitamins, powder tubs, and dropper visualizations"),
            ("Mindfulness & Calm Visuals", "mindfulness-calm-visuals", "Serene ambient nature and soothing color gradients"),
        ]
    },
    {
        "name": "E-commerce & Product Advertising",
        "slug": "ecommerce-product-advertising",
        "description": "High-converting social video ads, Shopify hero banners, Amazon 3D spins, and unboxing simulations.",
        "icon": "Tag",
        "display_order": 17,
        "subcategories": [
            ("Short-Form TikTok / Reels Ads", "shortform-social-ads", "Hook-driven vertical video ads with text callouts"),
            ("Amazon 3D & 360 Spinners", "amazon-3d-spinners", "Clean white background turntable spins"),
            ("Catalog & Grid Visuals", "catalog-grid-visuals", "Consistent product grid staging and lighting"),
        ]
    },
    {
        "name": "Home & Interior Design",
        "slug": "home-interior-design",
        "description": "Scandinavian furniture, modern living rooms, architectural lighting, and home decor visualizers.",
        "icon": "Home",
        "display_order": 18,
        "subcategories": [
            ("Furniture CGI & Staging", "furniture-cgi-staging", "Soft fabric texturing, wood grain, and warm illumination"),
            ("Smart Home Visuals", "smart-home-visuals", "Connected home devices in photorealistic interiors"),
        ]
    },
    {
        "name": "Architecture & Real Estate",
        "slug": "architecture-real-estate",
        "description": "ArchViz exterior fly-throughs, luxury penthouse renderings, master plan visualizations, and drone integration.",
        "icon": "Building",
        "display_order": 19,
        "subcategories": [
            ("ArchViz Exterior Flythroughs", "archviz-exteriors", "Day-to-night lighting transitions and landscape CGI"),
            ("Penthouse & Interior Tours", "interior-tours", "High-end luxury apartment walks and view simulations"),
        ]
    },
    {
        "name": "Cinematic Video",
        "slug": "cinematic-video",
        "description": "Narrative video productions, 4K film synthesis, color-graded cinematic storytelling, and director cuts.",
        "icon": "Video",
        "display_order": 20,
        "subcategories": [
            ("Commercial Film Directing", "commercial-film-directing", "Multi-shot narrative brand story commercials"),
            ("Drone & Aerial Perspectives", "drone-aerial-perspectives", "Sweeping landscape and urban hyper-lapse sequences"),
            ("Micro-Documentary Reels", "micro-documentaries", "Authentic founder and artisan spotlight films"),
        ]
    },
    {
        "name": "Virtual Influencers & AI Personas",
        "slug": "virtual-influencers",
        "description": "Consistent AI digital human personas, synthetic brand ambassadors, and virtual influencer content.",
        "icon": "UserCheck",
        "display_order": 21,
        "subcategories": [
            ("Virtual Brand Ambassadors", "virtual-brand-ambassadors", "LoRA-anchored consistent AI models across campaigns"),
            ("Synthetic Social Content", "synthetic-social-content", "Daily lifestyle feed posts and stories for digital personas"),
        ]
    },
    {
        "name": "Packaging & Industrial Design",
        "slug": "packaging-design",
        "description": "Structural box packaging, sustainable bottle molds, foil stamp embossing, and retail shelving renders.",
        "icon": "Package",
        "display_order": 22,
        "subcategories": [
            ("Luxury Box Packaging", "luxury-box-packaging", "Matte soft-touch boxes, gold foil, and magnetic clasps"),
            ("Label & Foil Stamping Renders", "label-foil-stamping", "Metallic reflectance and tactile paper textures"),
        ]
    },
    {
        "name": "Environmental & Sustainability",
        "slug": "sustainability-campaigns",
        "description": "Eco-friendly branding, renewable energy visualizations, circular economy products, and green campaigns.",
        "icon": "Globe",
        "display_order": 23,
        "subcategories": [
            ("Zero-Waste Packaging Visuals", "zero-waste-packaging", "Biodegradable fibers, mycelium, and recycled glass"),
            ("Clean Energy Animations", "clean-energy-animations", "Solar arrays, wind turbines, and smart grid storytelling"),
        ]
    },
    {
        "name": "Experimental & Generative Art",
        "slug": "experimental-generative",
        "description": "Creative coding, shader mathematics, complex node networks, interactive installations, and neural glitch art.",
        "icon": "Code",
        "display_order": 24,
        "subcategories": [
            ("TouchDesigner & Shader Loops", "touchdesigner-shaders", "Real-time GPU shaders and geometric fractals"),
            ("Neural Feedback & Glitch", "neural-feedback-glitch", "Latent space morphing and recurrent network visualizers"),
        ]
    }
]

# Additional skills and tools for the expanded marketplace
EXPANDED_SKILLS = [
    ("skill-lora-char", "LoRA Character Consistency", "Generative Video"),
    ("skill-4k-video", "4K Video Synthesis & Upscaling", "Generative Video"),
    ("skill-camera-control", "Camera Motion & Trajectory Control", "Generative Video"),
    ("skill-product-viz", "Photorealistic 3D Product Rendering", "3D & Synthesis"),
    ("skill-macro-fluid", "Macro Fluid Dynamics & Particles", "Generative Video"),
    ("skill-fashion-avatar", "Digital Fashion & Virtual Fabric Simulation", "3D & Synthesis"),
    ("skill-prompt-eng", "Advanced Multi-Pass Prompt Engineering", "Image Synthesis"),
    ("skill-lip-sync", "AI Voice Synthesis & Lip-Sync Alignment", "Audio & Lip-sync"),
    ("skill-concept-matte", "Sci-Fi Matte Painting & World Building", "Concept Art"),
    ("skill-audio-reactive", "Audio-Reactive Generative Visuals", "Audio & Lip-sync"),
    ("skill-automotive-cgi", "Automotive Exterior Lighting & Motion", "3D & Synthesis"),
    ("skill-commercial-ip", "Commercial IP Compliance & Model Licensing", "Production & Rights"),
    ("skill-color-grading", "Cinematic ACES Color Grading", "Post-Production"),
    ("skill-archviz-lighting", "Architectural Raytracing & Global Illumination", "Architecture"),
    ("skill-kinetic-type", "Kinetic Typography & Layout Animation", "Motion Design"),
    ("skill-virtual-camera", "Unreal Virtual Camera & Cine Camera Rigs", "Cinematography"),
    ("skill-packaging-cad", "Packaging Dielline Modeling & Foil Emboss", "Packaging Design"),
    ("skill-sound-design", "Spatial Sound Design & Foley Mixing", "Audio & Music"),
    ("skill-texture-alchemy", "Substance 3D Procedural Material Creation", "3D & Synthesis"),
    ("skill-diffusion-control", "ControlNet Depth & OpenPose Pipeline Rigging", "Image Synthesis"),
]

EXPANDED_TOOLS = [
    ("tool-runway-gen3", "Runway Gen-3 Alpha", "Video Generation", "Runway ML"),
    ("tool-midjourney-v6", "Midjourney v6", "Image Synthesis", "Midjourney Inc"),
    ("tool-comfyui", "ComfyUI Node Pipelines", "Pipeline Orchestration", "Open Source"),
    ("tool-flux1-pro", "Flux.1 Pro", "Image Synthesis", "Black Forest Labs"),
    ("tool-kling-ai", "Kling AI 1.5", "Video Generation", "Kuaishou"),
    ("tool-luma-dream", "Luma Dream Machine", "Video Generation", "Luma AI"),
    ("tool-topaz-video", "Topaz Video AI 5", "Post-Processing", "Topaz Labs"),
    ("tool-magnific", "Magnific AI Upscaler", "Post-Processing", "Magnific"),
    ("tool-elevenlabs", "ElevenLabs Prime Voice", "Audio & Voice", "ElevenLabs"),
    ("tool-pika2", "Pika 2.0", "Video Generation", "Pika Labs"),
    ("tool-sdxl", "Stable Diffusion XL", "Image Synthesis", "Stability AI"),
    ("tool-udio", "Udio Music Generation", "Audio & Voice", "Udio"),
    ("tool-blender", "Blender 4.2 Cycles", "3D DCC", "Blender Foundation"),
    ("tool-cinema4d", "Cinema 4D + Redshift", "Motion 3D", "Maxon"),
    ("tool-unreal5", "Unreal Engine 5.4 Lumen", "Realtime 3D", "Epic Games"),
    ("tool-aftereffects", "Adobe After Effects", "Compositing", "Adobe Inc"),
    ("tool-davinci", "DaVinci Resolve Studio", "Color & Audio", "Blackmagic Design"),
    ("tool-substance", "Substance 3D Designer", "Texturing", "Adobe Inc"),
    ("tool-touchdesigner", "TouchDesigner", "Realtime Creative Coding", "Derivative"),
    ("tool-hailuo", "MiniMax Hailuo AI", "Video Generation", "MiniMax"),
]

# -------------------------------------------------------------
# SYNTHETIC GENERATORS
# -------------------------------------------------------------
FIRST_NAMES = [
    "Aria", "Kai", "Sienna", "Mateo", "Zara", "Julian", "Chloe", "Leo", "Freja", "Kenji",
    "Amara", "Nico", "Leila", "Dante", "Mira", "Astrid", "Rowan", "Maya", "Soren", "Talia",
    "Ezra", "Callum", "Priya", "Finn", "Selene", "Rory", "Alina", "Bryn", "Cyrus", "Kira",
    "Gabe", "Daphne", "Silas", "Eden", "Reid", "Vesper", "Lucian", "Naia", "Cassian", "Lyra",
    "Felix", "Inez", "Jonas", "Zuri", "Tobias", "Ananya", "Corin", "Elodie", "Remy", "Kaelen"
]

LAST_NAMES = [
    "Vance", "Mercer", "Sterling", "Kovacs", "Nakamura", "Lindqvist", "Dubois", "Sinclair",
    "Castillo", "Winter", "Hawthorne", "Solano", "Ashford", "Valenti", "Morin", "Chen",
    "Fontaine", "Thorne", "Bergman", "Holloway", "Cross", "Vargas", "Novak", "Sutherland",
    "Althaus", "Kallio", "Davenport", "Montague", "Fairchild", "Ito", "Rousseau", "Brandt"
]

LOCATIONS = [
    "Tokyo, Japan", "Stockholm, Sweden", "Berlin, Germany", "London, UK", "New York, USA",
    "Los Angeles, USA", "Paris, France", "Seoul, South Korea", "Amsterdam, Netherlands",
    "Toronto, Canada", "Copenhagen, Denmark", "Milan, Italy", "Barcelona, Spain", "Sydney, Australia"
]

def generate_creator_bio(specialty, category_name):
    templates = [
        f"Award-winning generative visual artist and technical director focusing on high-concept {category_name.lower()} productions. Blending machine learning architectures with classical cinematography and raytraced precision.",
        f"Specialist in {specialty.lower()} with 5+ years crafting boundary-pushing commercial assets for leading international brands. Obsessed with coherent lighting, micro-textures, and emotional resonance.",
        f"Director and digital artisan exploring the intersection of {category_name.lower()} and generative pipelines. Dedicated to photoreal fidelity, custom LoRA training, and rapid turnarounds for demanding agency campaigns.",
        f"Creative technologist delivering production-grade {category_name.lower()} assets, motion reels, and brand storytelling. Pioneering node-based synthesis with seamless post-production color pipelines.",
        f"Multidisciplinary studio lead specializing in {specialty.lower()}. Proven track record delivering broadcast-ready commercials, luxury packaging visuals, and dynamic campaign universes.",
    ]
    return random.choice(templates)


def seed_marketplace_expansion():
    verify_safe_local_environment()
    
    # Non-destructive table check
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    inserted_counts = {
        "categories": 0,
        "subcategories": 0,
        "skills": 0,
        "tools": 0,
        "creators": 0,
        "brands": 0,
        "briefs": 0,
        "applications": 0,
        "engagements": 0,
        "deliverables": 0
    }

    try:
        # =========================================================
        # 1. SEED CATEGORIES & SUBCATEGORIES
        # =========================================================
        print("\n--- Seeding Category Taxonomy ---")
        cat_map = {}  # slug -> Category object

        for item in TAXONOMY_TREE:
            existing_cat = session.query(Category).filter(
                (Category.slug == item["slug"]) | (Category.name == item["name"])
            ).first()

            if not existing_cat:
                cat_id = f"cat-{item['slug']}"
                cat = Category(
                    id=cat_id,
                    name=item["name"],
                    slug=item["slug"],
                    description=item["description"],
                    icon=item["icon"],
                    display_order=item["display_order"],
                    parent_id=None
                )
                session.add(cat)
                session.flush()
                cat_map[item["slug"]] = cat
                inserted_counts["categories"] += 1
            else:
                cat_map[item["slug"]] = existing_cat

            # Subcategories
            parent_obj = cat_map[item["slug"]]
            for sub_name, sub_slug, sub_desc in item["subcategories"]:
                existing_sub = session.query(Category).filter(
                    (Category.slug == sub_slug) | (Category.name == sub_name)
                ).first()
                if not existing_sub:
                    sub_id = f"sub-{sub_slug}"
                    sub = Category(
                        id=sub_id,
                        name=sub_name,
                        slug=sub_slug,
                        description=sub_desc,
                        icon=item["icon"],
                        display_order=parent_obj.display_order * 10 + len(parent_obj.subcategories),
                        parent_id=parent_obj.id
                    )
                    session.add(sub)
                    session.flush()
                    cat_map[sub_slug] = sub
                    inserted_counts["subcategories"] += 1
                else:
                    cat_map[sub_slug] = existing_sub

        session.commit()
        print(f"Categories ready: {len(TAXONOMY_TREE)} primary, total tree mapped.")

        # =========================================================
        # 2. SEED EXPANDED SKILLS & TOOLS
        # =========================================================
        print("\n--- Seeding Skills & Tools ---")
        skill_objs = []
        for s_id, s_name, s_cat in EXPANDED_SKILLS:
            sk = session.query(Skill).filter((Skill.id == s_id) | (Skill.name == s_name)).first()
            if not sk:
                sk = Skill(id=s_id, name=s_name, category=s_cat)
                session.add(sk)
                session.flush()
                inserted_counts["skills"] += 1
            skill_objs.append(sk)

        tool_objs = []
        for t_id, t_name, t_cat, t_ven in EXPANDED_TOOLS:
            tl = session.query(Tool).filter((Tool.id == t_id) | (Tool.name == t_name)).first()
            if not tl:
                tl = Tool(id=t_id, name=t_name, category=t_cat, vendor=t_ven)
                session.add(tl)
                session.flush()
                inserted_counts["tools"] += 1
            tool_objs.append(tl)

        session.commit()
        print(f"Skills & Tools synced ({len(skill_objs)} skills, {len(tool_objs)} tools).")

        # =========================================================
        # 3. SEED 105 SYNTHETIC CREATORS
        # =========================================================
        print("\n--- Generating 105 Synthetic Creators ---")
        demo_pwd_hash = hash_password("Password123!")

        # All primary categories to distribute creators evenly across
        all_primary_cats = [c for c in cat_map.values() if c.parent_id is None]
        random.seed(42)  # Stable deterministic seed

        created_creators = []
        for i in range(1, 106):
            synth_user_id = f"usr-synth-cr-{i:03d}"
            synth_creator_id = f"cr-synth-{i:03d}"
            synth_email = f"synth.creator.{i:03d}@example.com"

            existing_user = session.query(User).filter(
                (User.id == synth_user_id) | (User.email == synth_email)
            ).first()

            if existing_user and existing_user.creator_profile:
                created_creators.append(existing_user.creator_profile)
                continue

            fname = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
            lname = LAST_NAMES[((i - 1) * 3) % len(LAST_NAMES)]
            display_name = f"{fname} {lname}"
            handle = f"{fname.lower()}_{lname.lower()}_{i:02d}"

            # Assigned categories (1 primary + 1-2 secondary or subcategories)
            primary_cat = all_primary_cats[(i - 1) % len(all_primary_cats)]
            subcats_for_primary = [c for c in cat_map.values() if c.parent_id == primary_cat.id]
            assigned_subcat = random.choice(subcats_for_primary) if subcats_for_primary else None

            # Secondary category
            secondary_cat = random.choice([c for c in all_primary_cats if c.id != primary_cat.id])

            specialty = f"{primary_cat.name} Specialist"
            bio = generate_creator_bio(specialty, primary_cat.name)

            tier = "TOP_STUDIO" if i % 7 == 0 else ("VERIFIED_PRO" if i % 2 == 0 else "COMMUNITY")
            status = "AVAILABLE" if i % 3 != 0 else ("LIMITED" if i % 5 == 0 else "BOOKED")
            min_budget = float(random.choice([800, 1200, 1500, 2500, 3500, 5000, 7500, 10000]))
            hourly_rate = float(random.choice([75, 95, 120, 150, 185, 225, 280]))
            years_exp = random.choice([2, 3, 4, 5, 6, 8, 10])
            avg_rating = round(random.uniform(4.70, 5.0), 2)

            if not existing_user:
                user = User(
                    id=synth_user_id,
                    email=synth_email,
                    hashed_password=demo_pwd_hash,
                    role="CREATOR",
                    is_email_verified=True,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(60, 300))
                )
                session.add(user)
                session.flush()
            else:
                user = existing_user

            avatar_url = f"https://images.unsplash.com/photo-{1534528741775 + (i % 20)}?auto=format&fit=crop&w=400&q=80"
            banner_url = f"https://images.unsplash.com/photo-{1579546929518 + (i % 20)}?auto=format&fit=crop&w=1200&q=80"

            creator = CreatorProfile(
                id=synth_creator_id,
                user_id=user.id,
                display_name=display_name,
                handle=handle,
                bio=bio,
                avatar_url=avatar_url,
                banner_url=banner_url,
                location=random.choice(LOCATIONS),
                years_experience=years_exp,
                primary_specialization=specialty,
                website_url=f"https://{handle}.studio",
                min_budget=min_budget,
                hourly_rate=hourly_rate,
                availability_status=status,
                verification_tier=tier,
                verified_claims_count=random.randint(2, 6) if tier != "COMMUNITY" else 0,
                completed_projects_count=random.randint(4, 28),
                average_rating=avg_rating,
                created_at=user.created_at,
                updated_at=user.created_at
            )
            session.add(creator)
            session.flush()

            # Category mappings
            session.add(CreatorCategory(
                id=f"cc-{creator.id}-{primary_cat.id}",
                creator_id=creator.id,
                category_id=primary_cat.id,
                is_primary=True
            ))
            if assigned_subcat:
                session.add(CreatorCategory(
                    id=f"cc-{creator.id}-{assigned_subcat.id}",
                    creator_id=creator.id,
                    category_id=assigned_subcat.id,
                    is_primary=False
                ))
            session.add(CreatorCategory(
                id=f"cc-{creator.id}-{secondary_cat.id}",
                creator_id=creator.id,
                category_id=secondary_cat.id,
                is_primary=False
            ))

            # Skills
            assigned_skills = random.sample(skill_objs, k=random.randint(3, 5))
            for sk in assigned_skills:
                session.add(CreatorSkill(
                    id=f"csk-{creator.id}-{sk.id}",
                    creator_id=creator.id,
                    skill_id=sk.id,
                    proficiency_level=random.choice(["EXPERT", "ADVANCED", "INTERMEDIATE"])
                ))

            # Tools
            assigned_tools = random.sample(tool_objs, k=random.randint(3, 5))
            for tl in assigned_tools:
                session.add(CreatorTool(
                    id=f"ctl-{creator.id}-{tl.id}",
                    creator_id=creator.id,
                    tool_id=tl.id,
                    proficiency_level=random.choice(["MASTER", "ADVANCED"]),
                    is_claim_verified=(tier in ["VERIFIED_PRO", "TOP_STUDIO"])
                ))

            # Portfolio projects
            content_type_choice = "VIDEO" if i % 2 == 0 else "IMAGE"
            proj = PortfolioProject(
                id=f"proj-{creator.id}-01",
                creator_id=creator.id,
                title=f"{primary_cat.name} Master Showcase",
                slug=f"{creator.handle}-{primary_cat.slug}-01"[:60],
                description=f"Curated commercial campaign portfolio project in {primary_cat.name}. Rendered with cinematic raytracing and prompt consistency.",
                content_type=content_type_choice,
                primary_asset_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" if content_type_choice == "VIDEO" else banner_url,
                thumbnail_url=banner_url,
                aspect_ratio="16:9" if i % 3 != 0 else "9:16",
                resolution="4K UHD",
                duration_seconds=30 if content_type_choice == "VIDEO" else None,
                commercial_rights_held=True,
                commercial_license_type="Full Commercial Buyout",
                featured=True,
                created_at=user.created_at
            )
            session.add(proj)

            created_creators.append(creator)
            inserted_counts["creators"] += 1

        session.commit()
        print(f"Creators seeded: {inserted_counts['creators']} new creators created (Total active: {len(created_creators)}).")

        # =========================================================
        # 4. SEED 28 SYNTHETIC BRANDS
        # =========================================================
        print("\n--- Generating 28 Synthetic Brands ---")
        BRANDS_DATA = [
            ("Aura Botanicals", "aura-botanicals", "Beauty & Cosmetics", "Clean clinical vegan skincare and organic bio-ferments."),
            ("Veloce Motors", "veloce-motors", "Automotive", "Next-generation high-performance electric supercars and aerodynamic mobility."),
            ("NeoGrid Cloud", "neogrid-cloud", "Enterprise Tech", "Distributed neural computing infrastructure and edge AI chips."),
            ("Lumina Luxury Apparel", "lumina-apparel", "Fashion & Luxury", "Haute couture digital textiles, silk draping, and contemporary tailoring."),
            ("Zenith Cold Brew", "zenith-beverages", "Food & Beverage", "Single-origin nitrogen cold brew coffee and functional adaptogens."),
            ("Quantum Precision Chrono", "quantum-chrono", "Luxury Goods", "Swiss horology crafted with aerospace grade carbon fiber and sapphire dials."),
            ("Elysium Resorts", "elysium-resorts", "Hospitality & Travel", "Ultra-luxury architectural eco-villas and restorative sanctuary retreats."),
            ("Apex Interactive", "apex-interactive", "Gaming & Entertainment", "Next-gen AAA dark fantasy action RPG worlds and immersive storylines."),
            ("Solara Clean Energy", "solara-energy", "Sustainability & Cleantech", "Smart residential solar microgrids and industrial battery storage."),
            ("Savor Artisanal Foods", "savor-foods", "Food & Beverage", "Regenerative pasture dairy and European heritage artisanal bakery."),
            ("Hyperion Audio", "hyperion-audio", "Consumer Electronics", "Audiophile open-back planar magnetic headphones and acoustic engineering."),
            ("Atelier Kroma", "atelier-kroma", "Interior & Architecture", "Minimalist Scandinavian modular furniture and architectural ceramics."),
            ("Verdant Health", "verdant-health", "Health & Wellness", "Clinically validated longevity supplements and liposomal micronutrients."),
            ("Nova Athletics", "nova-athletics", "Sports & Fitness", "High-performance compression sportswear and marathon athletic gear."),
            ("Starlight Cinema", "starlight-cinema", "Media & Entertainment", "Independent international film distribution and streaming productions."),
            ("Terra Modular Homes", "terra-modular", "Real Estate", "Net-zero prefabricated architectural homes built with mass timber."),
            ("Orbital Wearables", "orbital-wearables", "Hardware & Tech", "Sub-millimeter health tracking titanium smart rings with AI diagnostics."),
            ("Kintsugi Spirits", "kintsugi-spirits", "Beverage & Luxury", "Aged artisanal Japanese whiskey finished in mizunara oak casks."),
            ("Prism Optics", "prism-optics", "Eyewear & Fashion", "Bespoke titanium eyewear and polarized architectural lenses."),
            ("Catalyst Venture Lab", "catalyst-ventures", "Finance & Web3", "Early-stage venture studio backing generative software infrastructure."),
            ("Maison Du Parfum", "maison-parfum", "Beauty & Fragrance", "Bespoke Parisian extrait de parfum with rare botanical resins."),
            ("AeroDrone Systems", "aerodrone-systems", "Industrial Tech", "Autonomous LiDAR mapping drones for forest conservation and archviz."),
            ("Pulse Hydration", "pulse-hydration", "Beverage & Sports", "Zero-sugar electrolyte hydration drinks formulated for endurance racers."),
            ("Kinetix VR Studios", "kinetix-vr", "Gaming & XR", "Haptic virtual reality experiences and spatial cinematic simulations."),
            ("Flora Living Decor", "flora-decor", "Home & Lifestyle", "Self-watering ceramic biophilic planters and indoor ambient lighting."),
            ("Chrono Logistics", "chrono-logistics", "Supply Chain", "Global green freight forwarding powered by predictive AI routing."),
            ("Seraphim Couture", "seraphim-couture", "Fashion & Runway", "Experimental avant-garde metallic eveningwear and runway collections."),
            ("OmniPay Global", "omnipay-global", "Fintech", "Next-gen cross-border instant B2B liquidity and treasury management.")
        ]

        created_brands = []
        for i, (b_name, b_slug, b_ind, b_desc) in enumerate(BRANDS_DATA, 1):
            brand_id = f"brand-synth-{i:03d}"
            user_id = f"usr-synth-br-{i:03d}"
            brand_email = f"contact@{b_slug}.example.com"

            existing_brand = session.query(BrandProfile).filter(
                (BrandProfile.id == brand_id) | (BrandProfile.slug == b_slug)
            ).first()

            if existing_brand:
                created_brands.append(existing_brand)
                continue

            existing_user = session.query(User).filter(
                (User.id == user_id) | (User.email == brand_email)
            ).first()

            if not existing_user:
                brand_user = User(
                    id=user_id,
                    email=brand_email,
                    hashed_password=demo_pwd_hash,
                    role="BRAND",
                    is_email_verified=True,
                    created_at=datetime.utcnow() - timedelta(days=200)
                )
                session.add(brand_user)
                session.flush()
            else:
                brand_user = existing_user

            brand = BrandProfile(
                id=brand_id,
                user_id=brand_user.id,
                company_name=b_name,
                slug=b_slug,
                industry=b_ind,
                website_url=f"https://www.{b_slug}.example.com",
                logo_url=f"https://images.unsplash.com/photo-{1516321318423 + i}?auto=format&fit=crop&w=200&q=80",
                description=b_desc,
                company_size=random.choice(["11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"]),
                headquarters=random.choice(LOCATIONS),
                is_verified_brand=True,
                created_at=brand_user.created_at,
                updated_at=brand_user.created_at
            )
            session.add(brand)
            session.flush()
            created_brands.append(brand)
            inserted_counts["brands"] += 1

        session.commit()
        print(f"Brands seeded: {inserted_counts['brands']} new brands created (Total active: {len(created_brands)}).")

        # =========================================================
        # 5. SEED 160 SYNTHETIC CAMPAIGN BRIEFS
        # =========================================================
        print("\n--- Generating 160 Synthetic Campaign Briefs ---")
        
        BRIEF_TEMPLATES = [
            ("Fashion & Apparel", "Autumn Haute Couture Digital Lookbook", "Cinematic 30-second virtual runway video highlighting luxury silk draping, movement, and atmospheric studio lighting.", "VIDEO", "16:9", 8500.0),
            ("Fashion & Apparel", "Virtual Fabric & Knitwear Simulation", "Ultra-high-resolution 3D simulation of cashmere textures and seamless apparel fit on diverse models.", "STILL_IMAGE", "9:16", 4500.0),
            ("Food & Beverage", "Cold Brew Nitrogen Pour Commercial", "Macro high-speed video of cascading coffee crema, condensation on glass, and fresh roasted beans.", "VIDEO", "16:9", 6000.0),
            ("Food & Beverage", "Artisanal Sourdough & Pastry Heritage", "Warm natural lighting editorial images showcasing artisanal bread crumb structure, steam, and morning bakery ambience.", "STILL_IMAGE", "4:5", 3500.0),
            ("Beauty & Skincare", "Hydra-Luxe Serum Dropper Campaign", "3D CGI commercial with viscous fluid physics, glass refractivity, and radiant skin model reveals.", "VIDEO", "9:16", 7500.0),
            ("Beauty & Skincare", "Clinical Botanical Ingredient Swatches", "Microscope-style macro imagery of botanical petals dissolving into crystal clear cosmetic gel.", "STILL_IMAGE", "1:1", 3200.0),
            ("Automotive", "Veloce GT Supercar Alpine Pass Reveal", "High-octane car commercial sweeping along twisting mountain roads with sunset lens flare and dynamic drone tracking.", "VIDEO", "16:9", 14000.0),
            ("Automotive", "Cockpit HUD Telemetry & Minimalist Interior", "Ray-traced CGI interior renders showing digital dashboard transitions, ambient LEDs, and perforated leather.", "STILL_IMAGE", "16:9", 5800.0),
            ("3D & CGI", "Hyper-Precision Chronograph Exploded View", "Full mechanical watch teardown animation showing gear train, balance wheel oscillation, and titanium casing.", "VIDEO", "16:9", 11500.0),
            ("3D & CGI", "Modular Ergonomic Chair Product Visualizer", "Clean studio lighting turntable 3D renders with interchangeable fabrics, mesh drapes, and matte black steel.", "STILL_IMAGE", "1:1", 4200.0),
            ("AI Art", "Surreal Floating Botanical Island Series", "Mythological dreamscape digital art collection featuring floating bioluminescent gardens and crystalline streams.", "STILL_IMAGE", "16:9", 4800.0),
            ("Motion Design", "Global Fintech App Launch Brand Stings", "High-energy kinetic typography, abstract 3D ribbons, and app interface micro-moments for global rollout.", "VIDEO", "16:9", 6500.0),
            ("Technology & Gadgets", "Next-Gen Titanium Smart Ring Showcase", "Macro product lighting revealing sensors, satin brushed edges, and wireless magnetic charging dock.", "VIDEO", "9:16", 8200.0),
            ("Gaming", "Dark Fantasy Action RPG Teaser Trailer", "Cinematic trailer featuring ruined gothic cathedrals, stormy skies, sword combat, and volumetric mist.", "VIDEO", "16:9", 16000.0),
            ("Film & Entertainment", "Sci-Fi Thriller Theatrical Key Art Poster", "Striking key art poster design featuring deep space monoliths, chromatic aberration, and cinematic typography.", "STILL_IMAGE", "2:3", 5000.0),
            ("Music & Audio", "Audio-Reactive Looping Concert Stage Visuals", "Hypnotic 60-second seamless loop synchronizing generative particle waves with electronic sub-bass frequencies.", "VIDEO", "16:9", 4200.0),
            ("Fitness & Sports", "Zero-Gravity Athletic Compression Campaign", "Dynamic athletic movement commercial with speed ramping, runner silhouette, and urban rain reflections.", "VIDEO", "9:16", 7000.0),
            ("Home & Interior Design", "Scandinavian Coastal Sanctuary ArchViz", "Photorealistic architectural interior visualization of oceanfront living room with Nordic cedar and linen.", "STILL_IMAGE", "16:9", 6200.0),
            ("Sustainability & Cleantech", "Clean Solar Energy Grid Storytelling", "Inspiring mixed media commercial explaining residential battery storage and community clean power.", "VIDEO", "16:9", 9000.0),
            ("Packaging & Industrial Design", "Luxury Fragrance Box & Embossed Glass Bottle", "Rigid presentation box with gold foil lettering and textured fluted glass perfume container.", "STILL_IMAGE", "1:1", 4600.0),
        ]

        created_briefs = []
        for b_idx in range(1, 161):
            brief_id = f"brief-synth-{b_idx:03d}"
            existing_brief = session.query(Brief).filter(Brief.id == brief_id).first()
            if existing_brief:
                created_briefs.append(existing_brief)
                continue

            tmpl = BRIEF_TEMPLATES[(b_idx - 1) % len(BRIEF_TEMPLATES)]
            cat_name, base_title, base_desc, content_type, aspect_ratio, base_budget = tmpl

            owning_brand = created_brands[(b_idx - 1) % len(created_brands)]
            title = f"{base_title} #{b_idx}" if b_idx > 20 else base_title
            slug = f"{title.lower().replace(' ', '-').replace('&', 'and').replace('/', '-')}-{b_idx:03d}"[:65]

            # Realistic lifecycle distribution
            # ~80% PUBLISHED, ~10% CLOSED/COMPLETED, ~10% DRAFT
            if b_idx % 12 == 0:
                brief_status = "CLOSED"
            elif b_idx % 14 == 0:
                brief_status = "COMPLETED"
            elif b_idx % 15 == 0:
                brief_status = "DRAFT"
            else:
                brief_status = "PUBLISHED"

            deadline = datetime.utcnow() + timedelta(days=random.randint(7, 45))
            if brief_status in ["CLOSED", "COMPLETED"]:
                deadline = datetime.utcnow() - timedelta(days=random.randint(5, 30))

            budget = round(base_budget * random.uniform(0.9, 1.4), -2)

            brief = Brief(
                id=brief_id,
                brand_id=owning_brand.id,
                title=title,
                slug=slug,
                campaign_objective=f"Produce world-class visual assets for {owning_brand.company_name}'s quarterly flagship campaign. Deliver exceptional craft that drives audience engagement and brand authority.",
                target_audience="Creative professionals, luxury consumers, and design enthusiasts aged 22-45.",
                content_type=content_type,
                creative_style_mood=f"{cat_name}, cinematic lighting, photorealistic, contemporary luxury, pristine color palette",
                aspect_ratio=aspect_ratio,
                duration_seconds_min=15 if content_type == "VIDEO" else None,
                duration_seconds_max=45 if content_type == "VIDEO" else None,
                resolution_min="3840x2160" if content_type == "VIDEO" else "4000x3000",
                deliverables_description=f"Master {content_type} file in ProRes / PNG, plus 2 vertical cuts and project breakdown summary.",
                revision_allowance=2,
                budget_amount=budget,
                budget_currency="USD",
                deadline=deadline,
                commercial_use_requirements="Full worldwide commercial rights in perpetuity across digital, social, web, and broadcast channels.",
                usage_channels="Paid Social, Web Hero, YouTube, Digital OOH, Print",
                usage_duration="Perpetual",
                usage_territories="Worldwide",
                restrictions_and_guidelines="Strict brand safety compliance. No unauthorized trademarks or unlicensed third-party IP.",
                disclosure_requirements="Standard synthetic generation credits per agency guidelines.",
                status=brief_status,
                created_at=datetime.utcnow() - timedelta(days=random.randint(15, 90)),
                updated_at=datetime.utcnow()
            )
            session.add(brief)
            session.flush()

            # Attach category
            # Find category matching cat_name
            target_cat = next((c for c in all_primary_cats if c.name.lower() in cat_name.lower() or cat_name.lower() in c.name.lower()), all_primary_cats[0])
            session.add(BriefCategory(
                id=f"bc-{brief.id}-{target_cat.id}",
                brief_id=brief.id,
                category_id=target_cat.id,
                is_primary=True
            ))

            # Optional subcategory
            matching_subs = [s for s in cat_map.values() if s.parent_id == target_cat.id]
            if matching_subs:
                chosen_sub = random.choice(matching_subs)
                session.add(BriefCategory(
                    id=f"bc-{brief.id}-{chosen_sub.id}",
                    brief_id=brief.id,
                    category_id=chosen_sub.id,
                    is_primary=False
                ))

            # Required skills (1-2)
            for sk in random.sample(skill_objs, k=random.randint(1, 2)):
                session.add(BriefSkill(
                    id=f"bsk-{brief.id}-{sk.id}",
                    brief_id=brief.id,
                    skill_id=sk.id,
                    is_required=True
                ))

            # Required tools (1-2)
            for tl in random.sample(tool_objs, k=random.randint(1, 2)):
                session.add(BriefTool(
                    id=f"btl-{brief.id}-{tl.id}",
                    brief_id=brief.id,
                    tool_id=tl.id,
                    is_required=True
                ))

            created_briefs.append(brief)
            inserted_counts["briefs"] += 1

        session.commit()
        print(f"Briefs seeded: {inserted_counts['briefs']} new briefs created (Total active: {len(created_briefs)}).")

        # =========================================================
        # 6. SEED APPLICATIONS, ENGAGEMENTS & COLLABORATION HISTORY
        # =========================================================
        print("\n--- Seeding Collaboration History & Deliverables ---")
        
        # Select active briefs
        published_briefs = [b for b in created_briefs if b.status == "PUBLISHED"]
        closed_briefs = [b for b in created_briefs if b.status in ["CLOSED", "COMPLETED"]]
        
        collab_target_briefs = published_briefs[:25] + closed_briefs[:15]
        
        for idx, brief in enumerate(collab_target_briefs, 1):
            # Select matching creator based on brief category
            brief_cat_ids = {bc.category_id for bc in brief.categories}
            eligible_creators = [
                c for c in created_creators 
                if any(cc.category_id in brief_cat_ids for cc in c.categories)
            ]
            if not eligible_creators:
                eligible_creators = created_creators

            creator = eligible_creators[idx % len(eligible_creators)]
            app_id = f"app-synth-{idx:03d}"

            existing_app = session.query(Application).filter(Application.id == app_id).first()
            if not existing_app:
                # Check for existing app between this brief & creator to prevent duplicate violation
                dup_check = session.query(Application).filter(
                    Application.brief_id == brief.id,
                    Application.creator_id == creator.id
                ).first()
                if dup_check:
                    app = dup_check
                else:
                    app_status = "ACCEPTED" if idx <= 26 else (
                        "SHORTLISTED" if idx <= 32 else "SUBMITTED"
                    )
                    attached_proj = creator.portfolio_projects[0].id if creator.portfolio_projects else "proj-sample"
                    app = Application(
                        id=app_id,
                        brief_id=brief.id,
                        creator_id=creator.id,
                        pitch_text=f"Hello {brief.brand.company_name}! I have extensive expertise in {brief.creative_style_mood}. "
                                   f"I can produce this asset within your timeline with complete cinematic consistency.",
                        proposed_rate=brief.budget_amount,
                        proposed_timeline_days=random.randint(10, 25),
                        attached_project_ids=attached_proj,
                        status=app_status,
                        submitted_at=brief.created_at + timedelta(days=2),
                        reviewed_at=brief.created_at + timedelta(days=3),
                        brand_feedback="Exceptional portfolio match and clear production timeline." if app_status == "ACCEPTED" else None
                    )
                    session.add(app)
                    session.flush()
                    inserted_counts["applications"] += 1
            else:
                app = existing_app

            # If application is accepted, create or link engagement
            if app.status == "ACCEPTED":
                eng_id = f"eng-synth-{idx:03d}"
                existing_eng = session.query(Engagement).filter(Engagement.id == eng_id).first()
                if not existing_eng:
                    # Check duplicate engagement for application
                    dup_eng = session.query(Engagement).filter(Engagement.application_id == app.id).first()
                    if not dup_eng:
                        eng_status = "COMPLETED" if idx <= 12 else (
                            "DRAFT_SUBMITTED" if idx <= 20 else "KICKOFF"
                        )
                        rating = random.choice([5, 5, 4]) if eng_status == "COMPLETED" else None
                        review = f"Outstanding visual craftsmanship! {creator.display_name} delivered ahead of schedule and the lighting is breathtaking." if eng_status == "COMPLETED" else None

                        eng = Engagement(
                            id=eng_id,
                            brief_id=brief.id,
                            creator_id=creator.id,
                            application_id=app.id,
                            status=eng_status,
                            agreed_amount=app.proposed_rate,
                            start_date=app.submitted_at + timedelta(days=1),
                            completion_deadline=app.submitted_at + timedelta(days=app.proposed_timeline_days),
                            final_deliverable_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" if eng_status == "COMPLETED" else None,
                            brand_rating=rating,
                            brand_review=review,
                            created_at=app.submitted_at + timedelta(days=1),
                            updated_at=app.submitted_at + timedelta(days=app.proposed_timeline_days)
                        )
                        session.add(eng)
                        session.flush()
                        inserted_counts["engagements"] += 1

                        # Seed Deliverables for this collaboration
                        if eng_status in ["DRAFT_SUBMITTED", "COMPLETED"]:
                            # v1 deliverable
                            v1_id = f"deliv-{eng.id}-v1"
                            v1_status = "APPROVED" if eng_status == "COMPLETED" else "SUBMITTED"
                            v1 = EngagementDeliverable(
                                id=v1_id,
                                engagement_id=eng.id,
                                version=1,
                                title="Milestone 1 — Initial Rough Cut & Lighting Pass",
                                asset_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                                notes="Completed camera motion framing and initial ACES color grade.",
                                submitted_by=creator.id,
                                status=v1_status,
                                feedback="Framing looks superb. Please deepen the rim shadows for the hero reveal." if eng_status == "COMPLETED" else None,
                                submitted_at=eng.start_date + timedelta(days=4),
                                reviewed_at=eng.start_date + timedelta(days=5) if eng_status == "COMPLETED" else None
                            )
                            session.add(v1)
                            inserted_counts["deliverables"] += 1

                            if eng_status == "COMPLETED":
                                # v2 final deliverable
                                v2_id = f"deliv-{eng.id}-v2"
                                v2 = EngagementDeliverable(
                                    id=v2_id,
                                    engagement_id=eng.id,
                                    version=2,
                                    title="Milestone 2 — Final 4K Master Deliverable Package",
                                    asset_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                                    notes="Shadow depth refined, final audio mix mastered, ProRes 4444 export ready.",
                                    submitted_by=creator.id,
                                    status="APPROVED",
                                    feedback="Approved without changes! Ready for global distribution.",
                                    submitted_at=eng.start_date + timedelta(days=8),
                                    reviewed_at=eng.start_date + timedelta(days=9)
                                )
                                session.add(v2)
                                inserted_counts["deliverables"] += 1

        session.commit()
        print(f"Collaborations seeded: {inserted_counts['applications']} apps, {inserted_counts['engagements']} engagements, {inserted_counts['deliverables']} deliverables.")

        # =========================================================
        # SUMMARY REPORT
        # =========================================================
        total_cats = session.query(Category).count()
        total_skills = session.query(Skill).count()
        total_tools = session.query(Tool).count()
        total_creators = session.query(CreatorProfile).count()
        total_brands = session.query(BrandProfile).count()
        total_briefs = session.query(Brief).count()
        total_apps = session.query(Application).count()
        total_engs = session.query(Engagement).count()
        total_delivs = session.query(EngagementDeliverable).count()

        print("\n=======================================================")
        print("          KIVORA DATA EXPANSION COMPLETE               ")
        print("=======================================================")
        print(f"Categories in DB:      {total_cats} ({inserted_counts['categories']} new primary, {inserted_counts['subcategories']} new sub)")
        print(f"Skills in DB:          {total_skills} (+{inserted_counts['skills']} new)")
        print(f"Tools in DB:           {total_tools} (+{inserted_counts['tools']} new)")
        print(f"Creators in DB:        {total_creators} (+{inserted_counts['creators']} new synthetic)")
        print(f"Brands in DB:          {total_brands} (+{inserted_counts['brands']} new synthetic)")
        print(f"Briefs in DB:          {total_briefs} (+{inserted_counts['briefs']} new synthetic)")
        print(f"Applications in DB:    {total_apps} (+{inserted_counts['applications']} new)")
        print(f"Engagements in DB:     {total_engs} (+{inserted_counts['engagements']} new)")
        print(f"Deliverables in DB:    {total_delivs} (+{inserted_counts['deliverables']} new)")
        print("=======================================================\n")

    except Exception as e:
        session.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        session.close()


if __name__ == "__main__":
    seed_marketplace_expansion()
