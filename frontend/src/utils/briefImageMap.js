/**
 * briefImageMap.js
 *
 * Centralized, deterministic domain-specific image mapping utility for Kivora Campaign Briefs.
 * Maps creative domains to curated 512x512 PNG assets located in:
 * `src/assets/Kivora_All_Domains_262_Images/<DOMAIN>/<DOMAIN>_image<N>.png`
 *
 * Provides:
 * 1. Eager Vite bundling for all 262 local domain image assets.
 * 2. Public static path fallbacks (/assets/briefs/<DOMAIN>/...).
 * 3. Robust domain resolution from categories, subcategories, title, objective, and brand industry.
 * 4. Stable deterministic image assignment preventing visible repetition across brief cards.
 * 5. Preservation of authoritative brand user uploads (/uploads/...).
 */

import {
  getCampaignBriefImage,
  CAMPAIGN_BRIEF_IMAGE_MAP,
} from '../data/campaignBriefImageMap';

// 1. Eager Vite glob importing all 262 campaign assets across all 15 creative domains
export const BRIEF_IMAGE_MODULES = import.meta.glob(
  '../assets/Kivora_All_Domains_262_Images/*/*.png',
  { eager: true, import: 'default' }
);

// 2. Canonical domain folders and display metadata
export const DOMAIN_FOLDERS = [
  '3D_CGI',
  'AI_ART',
  'AUTOMOTIVE',
  'BEAUTY_SKINCARE',
  'CINEMATIC_VIDEO',
  'FASHION_APPAREL',
  'FILM_ENTERTAINMENT',
  'FITNESS_SPORTS',
  'FOOD_BEVERAGE',
  'GAMING',
  'HOME_INTERIOR_DESIGN',
  'MOTION_DESIGN',
  'MUSIC_AUDIO',
  'PACKAGING_INDUSTRIAL_DESIGN',
  'TECHNOLOGY_GADGETS',
];

export const DOMAIN_LABELS = {
  '3D_CGI': '3D & CGI',
  'AI_ART': 'AI Art',
  'AUTOMOTIVE': 'Automotive',
  'BEAUTY_SKINCARE': 'Beauty & Skincare',
  'CINEMATIC_VIDEO': 'Cinematic Video',
  'FASHION_APPAREL': 'Fashion & Apparel',
  'FILM_ENTERTAINMENT': 'Film & Entertainment',
  'FITNESS_SPORTS': 'Fitness & Sports',
  'FOOD_BEVERAGE': 'Food & Beverage',
  'GAMING': 'Gaming',
  'HOME_INTERIOR_DESIGN': 'Home & Interior Design',
  'MOTION_DESIGN': 'Motion Design',
  'MUSIC_AUDIO': 'Music & Audio',
  'PACKAGING_INDUSTRIAL_DESIGN': 'Packaging & Industrial Design',
  'TECHNOLOGY_GADGETS': 'Technology & Gadgets',
};

// 3. Natural numerical sort for filenames (e.g. image1, image2, ..., image10)
function naturalSortCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// 4. Index and sort images by domain folder
export const DOMAIN_IMAGES = {};
export const DOMAIN_PUBLIC_FALLBACKS = {};

// Initialize arrays for all canonical domains
DOMAIN_FOLDERS.forEach((domain) => {
  DOMAIN_IMAGES[domain] = [];
  DOMAIN_PUBLIC_FALLBACKS[domain] = [];
});

// Populate DOMAIN_IMAGES from Vite glob results
const sortedGlobKeys = Object.keys(BRIEF_IMAGE_MODULES).sort(naturalSortCompare);

sortedGlobKeys.forEach((key) => {
  // Key format: "../assets/Kivora_All_Domains_262_Images/AUTOMOTIVE/AUTOMOTIVE_image1.png"
  const parts = key.split('/');
  const filename = parts[parts.length - 1];
  const domainFolder = parts[parts.length - 2];

  if (DOMAIN_IMAGES[domainFolder]) {
    const assetUrl = BRIEF_IMAGE_MODULES[key];
    DOMAIN_IMAGES[domainFolder].push(assetUrl);
    DOMAIN_PUBLIC_FALLBACKS[domainFolder].push(`/assets/briefs/${domainFolder}/${filename}`);
  }
});

// Default fallback cover if domain is missing or unresolvable
export const DEFAULT_FALLBACK_COVER =
  DOMAIN_IMAGES['BEAUTY_SKINCARE']?.[0] || '/assets/campaign-covers/brand_skincare_cover.jpg';

// 5. Explicit category slug to domain folder mapping
export const CATEGORY_SLUG_TO_DOMAIN = {
  // 3D & CGI
  '3d-cgi-animation': '3D_CGI',
  '3d-cgi': '3D_CGI',
  '3d-animation': '3D_CGI',
  'visual-effects': '3D_CGI',
  'product-viz': '3D_CGI',
  'compositing-matchmove': '3D_CGI',
  'virtual-production-sets': '3D_CGI',
  'set-extension-matte': '3D_CGI',
  'amazon-3d-spinners': '3D_CGI',
  '3d-product-rendering': '3D_CGI',
  'cgi-environments': '3D_CGI',
  'automotive-cgi-sub': 'AUTOMOTIVE',
  'fluid-particle-sim': '3D_CGI',

  // AI Art
  'ai-art-creative-direction': 'AI_ART',
  'ai-art': 'AI_ART',
  'generative-illustration': 'AI_ART',
  'concept-art-sub': 'AI_ART',
  'surreal-art': 'AI_ART',
  'experimental-visuals': 'AI_ART',
  'experimental-generative': 'AI_ART',
  'illustration': 'AI_ART',
  'editorial-illustration': 'AI_ART',
  'character-concept-design': 'AI_ART',
  'touchdesigner-shaders': 'AI_ART',
  'neural-feedback-glitch': 'AI_ART',

  // Automotive
  'automotive': 'AUTOMOTIVE',
  'vehicle-commercials': 'AUTOMOTIVE',
  'cockpit-interior-ux': 'AUTOMOTIVE',
  'ev-mobility-campaigns': 'AUTOMOTIVE',
  'automotive-motion-design': 'AUTOMOTIVE',

  // Beauty & Skincare
  'beauty-skincare': 'BEAUTY_SKINCARE',
  'skincare-campaigns': 'BEAUTY_SKINCARE',
  'beauty-product-visualization': 'BEAUTY_SKINCARE',
  'makeup-concepts': 'BEAUTY_SKINCARE',
  'cosmetic-advertising': 'BEAUTY_SKINCARE',
  'health-wellness': 'BEAUTY_SKINCARE',
  'supplement-packaging-cgi': 'BEAUTY_SKINCARE',
  'mindfulness-calm-visuals': 'BEAUTY_SKINCARE',

  // Cinematic Video
  'cinematic-video': 'CINEMATIC_VIDEO',
  'commercial-film-directing': 'CINEMATIC_VIDEO',
  'drone-aerial-perspectives': 'CINEMATIC_VIDEO',
  'micro-documentaries': 'CINEMATIC_VIDEO',

  // Fashion & Apparel
  'fashion-apparel': 'FASHION_APPAREL',
  'fashion-campaigns': 'FASHION_APPAREL',
  'virtual-try-on-concepts': 'FASHION_APPAREL',
  'apparel-product-visualization': 'FASHION_APPAREL',
  'accessories-jewelry': 'FASHION_APPAREL',
  'virtual-influencers': 'FASHION_APPAREL',
  'virtual-brand-ambassadors': 'FASHION_APPAREL',
  'synthetic-social-content': 'FASHION_APPAREL',

  // Film & Entertainment
  'film-entertainment': 'FILM_ENTERTAINMENT',
  'movie-posters-key-art': 'FILM_ENTERTAINMENT',
  'title-sequences': 'FILM_ENTERTAINMENT',
  'teaser-trailers': 'FILM_ENTERTAINMENT',

  // Fitness & Sports
  'fitness-sports': 'FITNESS_SPORTS',
  'athletic-apparel-promos': 'FITNESS_SPORTS',
  'gym-equipment-cgi': 'FITNESS_SPORTS',
  'action-sports-editing': 'FITNESS_SPORTS',

  // Food & Beverage
  'food-beverage': 'FOOD_BEVERAGE',
  'food-photography-cgi': 'FOOD_BEVERAGE',
  'beverage-advertising': 'FOOD_BEVERAGE',
  'beverage-packaging-concepts': 'FOOD_BEVERAGE',
  'restaurant-campaigns': 'FOOD_BEVERAGE',

  // Gaming
  'gaming': 'GAMING',
  'game-trailers-cinematics': 'GAMING',
  'game-assets-concept-art': 'GAMING',
  'esports-broadcast-design': 'GAMING',

  // Home & Interior Design
  'home-interior-design': 'HOME_INTERIOR_DESIGN',
  'furniture-cgi-staging': 'HOME_INTERIOR_DESIGN',
  'smart-home-visuals': 'HOME_INTERIOR_DESIGN',
  'architecture-real-estate': 'HOME_INTERIOR_DESIGN',
  'archviz-exteriors': 'HOME_INTERIOR_DESIGN',
  'interior-tours': 'HOME_INTERIOR_DESIGN',

  // Motion Design
  'motion-design': 'MOTION_DESIGN',
  'kinetic-typography': 'MOTION_DESIGN',
  'brand-motion': 'MOTION_DESIGN',
  'mixed-motion': 'MOTION_DESIGN',
  'ui-interaction-motion': 'MOTION_DESIGN',

  // Music & Audio
  'music-audio': 'MUSIC_AUDIO',
  'album-art-vinyl': 'MUSIC_AUDIO',
  'audio-reactive-visualizers': 'MUSIC_AUDIO',
  'tour-stage-visuals': 'MUSIC_AUDIO',

  // Packaging & Industrial Design
  'packaging-design': 'PACKAGING_INDUSTRIAL_DESIGN',
  'packaging-industrial-design': 'PACKAGING_INDUSTRIAL_DESIGN',
  'luxury-box-packaging': 'PACKAGING_INDUSTRIAL_DESIGN',
  'label-foil-stamping': 'PACKAGING_INDUSTRIAL_DESIGN',
  'packaging-illustration': 'PACKAGING_INDUSTRIAL_DESIGN',
  'brand-design': 'PACKAGING_INDUSTRIAL_DESIGN',
  'visual-identity-systems': 'PACKAGING_INDUSTRIAL_DESIGN',
  'logotype-mark-design': 'PACKAGING_INDUSTRIAL_DESIGN',
  'brand-guidelines-tokens': 'PACKAGING_INDUSTRIAL_DESIGN',
  'ecommerce-product-advertising': 'PACKAGING_INDUSTRIAL_DESIGN',
  'shortform-social-ads': 'PACKAGING_INDUSTRIAL_DESIGN',
  'catalog-grid-visuals': 'PACKAGING_INDUSTRIAL_DESIGN',
  'sustainability-campaigns': 'PACKAGING_INDUSTRIAL_DESIGN',
  'zero-waste-packaging': 'PACKAGING_INDUSTRIAL_DESIGN',

  // Technology & Gadgets
  'technology-gadgets': 'TECHNOLOGY_GADGETS',
  'consumer-electronics-reveal': 'TECHNOLOGY_GADGETS',
  'exploded-component-renders': 'TECHNOLOGY_GADGETS',
  'smart-wearables': 'TECHNOLOGY_GADGETS',
};

// 6. Fast string hash for deterministic distribution
function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolves the creative domain folder name for a given campaign brief.
 * Priority:
 * 1. Explicit domain property if present on brief.
 * 2. Relational categories matching CATEGORY_SLUG_TO_DOMAIN.
 * 3. Text contextual corpus analysis (title, objective, creative style mood, brand industry).
 * 4. Fallback to 3D_CGI.
 *
 * @param {Object} brief - Campaign brief object
 * @returns {string} Domain folder name (e.g. 'FOOD_BEVERAGE', 'AUTOMOTIVE')
 */
export function resolveBriefDomain(brief) {
  if (!brief) return '3D_CGI';

  // If already tagged with an explicit domain matching our folders
  if (brief.domain && DOMAIN_FOLDERS.includes(brief.domain)) {
    return brief.domain;
  }

  const titleAndMood = [
    brief.title || '',
    brief.creative_style_mood || '',
    brief.content_type || '',
  ]
    .join(' ')
    .toLowerCase();

  // Tier 1: Title and Creative Style Mood (Primary domain determination)
  if (
    titleAndMood.includes('soundtrack') ||
    titleAndMood.includes('synth teaser') ||
    titleAndMood.includes('darkwave') ||
    titleAndMood.includes('concert stage') ||
    titleAndMood.includes('sub-bass') ||
    titleAndMood.includes('music audio') ||
    titleAndMood.includes('album art') ||
    titleAndMood.includes('vinyl packaging') ||
    titleAndMood.includes('audio-reactive')
  ) {
    return 'MUSIC_AUDIO';
  }

  if (
    titleAndMood.includes('haute couture') ||
    titleAndMood.includes('knitwear') ||
    titleAndMood.includes('virtual fabric') ||
    titleAndMood.includes('digital lookbook') ||
    titleAndMood.includes('digital runway') ||
    titleAndMood.includes('metamorphic silk') ||
    titleAndMood.includes('fashion & apparel') ||
    titleAndMood.includes('fashion campaign') ||
    titleAndMood.includes('silk draping') ||
    titleAndMood.includes('cashmere texture') ||
    titleAndMood.includes('eveningwear') ||
    titleAndMood.includes('runway collection')
  ) {
    return 'FASHION_APPAREL';
  }

  if (
    titleAndMood.includes('sourdough') ||
    titleAndMood.includes('pastry') ||
    titleAndMood.includes('cold brew') ||
    titleAndMood.includes('nitrogen pour') ||
    titleAndMood.includes('coffee') ||
    titleAndMood.includes('vital surge') ||
    titleAndMood.includes('beverage') ||
    titleAndMood.includes('drink') ||
    titleAndMood.includes('food & beverage') ||
    titleAndMood.includes('bakery') ||
    titleAndMood.includes('restaurant') ||
    titleAndMood.includes('roasted beans') ||
    titleAndMood.includes('artisanal bread') ||
    titleAndMood.includes('electrolyte hydration') ||
    titleAndMood.includes('japanese whiskey')
  ) {
    return 'FOOD_BEVERAGE';
  }

  if (
    titleAndMood.includes('supercar') ||
    titleAndMood.includes('alpine pass') ||
    titleAndMood.includes('cockpit') ||
    titleAndMood.includes('hud telemetry') ||
    titleAndMood.includes('hypercar') ||
    titleAndMood.includes('ev mobility') ||
    titleAndMood.includes('automotive') ||
    titleAndMood.includes('vehicle commercial') ||
    titleAndMood.includes('volt spectre') ||
    titleAndMood.includes('mountain roads')
  ) {
    return 'AUTOMOTIVE';
  }

  if (
    titleAndMood.includes('action rpg') ||
    titleAndMood.includes('dark fantasy') ||
    titleAndMood.includes('teaser trailer') ||
    titleAndMood.includes('gaming') ||
    titleAndMood.includes('character intro') ||
    titleAndMood.includes('esports') ||
    titleAndMood.includes('game trailers') ||
    titleAndMood.includes('gothic cathedral')
  ) {
    return 'GAMING';
  }

  if (
    titleAndMood.includes('fintech') ||
    titleAndMood.includes('brand stings') ||
    titleAndMood.includes('kinetic typography') ||
    titleAndMood.includes('motion design') ||
    titleAndMood.includes('motion explainer') ||
    titleAndMood.includes('quantum wealth') ||
    titleAndMood.includes('ui motion') ||
    titleAndMood.includes('app launch')
  ) {
    return 'MOTION_DESIGN';
  }

  if (
    titleAndMood.includes('smart ring') ||
    titleAndMood.includes('titanium smart') ||
    titleAndMood.includes('consumer electronics') ||
    titleAndMood.includes('technology & gadgets') ||
    titleAndMood.includes('smart wearables') ||
    titleAndMood.includes('wearable sensors') ||
    titleAndMood.includes('magnetic charging dock') ||
    titleAndMood.includes('headphones')
  ) {
    return 'TECHNOLOGY_GADGETS';
  }

  if (
    titleAndMood.includes('sci-fi thriller') ||
    titleAndMood.includes('theatrical key art') ||
    titleAndMood.includes('movie poster') ||
    titleAndMood.includes('film entertainment') ||
    titleAndMood.includes('film directing') ||
    titleAndMood.includes('deep space monoliths')
  ) {
    return 'FILM_ENTERTAINMENT';
  }

  if (
    titleAndMood.includes('athletic compression') ||
    titleAndMood.includes('zero-gravity athletic') ||
    titleAndMood.includes('runner silhouette') ||
    titleAndMood.includes('fitness & sports') ||
    titleAndMood.includes('fitness sports') ||
    titleAndMood.includes('gym equipment') ||
    titleAndMood.includes('speed ramping')
  ) {
    return 'FITNESS_SPORTS';
  }

  if (
    titleAndMood.includes('scandinavian') ||
    titleAndMood.includes('archviz') ||
    titleAndMood.includes('living room') ||
    titleAndMood.includes('interior design') ||
    titleAndMood.includes('home & interior') ||
    titleAndMood.includes('furniture cgi') ||
    titleAndMood.includes('modular home') ||
    titleAndMood.includes('sanctuary archviz') ||
    titleAndMood.includes('oceanfront living')
  ) {
    return 'HOME_INTERIOR_DESIGN';
  }

  if (
    titleAndMood.includes('fragrance box') ||
    titleAndMood.includes('embossed glass bottle') ||
    titleAndMood.includes('packaging design') ||
    titleAndMood.includes('packaging & industrial') ||
    titleAndMood.includes('luxury box') ||
    titleAndMood.includes('presentation box')
  ) {
    if (titleAndMood.includes('serum') || titleAndMood.includes('dewdrop')) {
      return 'BEAUTY_SKINCARE';
    }
    return 'PACKAGING_INDUSTRIAL_DESIGN';
  }

  if (
    titleAndMood.includes('surreal floating') ||
    titleAndMood.includes('botanical island') ||
    titleAndMood.includes('dreamscape') ||
    titleAndMood.includes('generative illustration') ||
    titleAndMood.includes('ai art') ||
    titleAndMood.includes('bioluminescent')
  ) {
    return 'AI_ART';
  }

  if (
    titleAndMood.includes('chronograph') ||
    titleAndMood.includes('exploded view') ||
    titleAndMood.includes('ergonomic chair') ||
    titleAndMood.includes('3d & cgi') ||
    titleAndMood.includes('3d product') ||
    titleAndMood.includes('clean solar energy') ||
    titleAndMood.includes('solar energy grid') ||
    titleAndMood.includes('mechanical watch') ||
    titleAndMood.includes('turntable 3d')
  ) {
    return '3D_CGI';
  }

  if (
    titleAndMood.includes('serum') ||
    titleAndMood.includes('dewdrop') ||
    titleAndMood.includes('skincare') ||
    titleAndMood.includes('botanical ingredient') ||
    titleAndMood.includes('radiant aura') ||
    titleAndMood.includes('vitamin c') ||
    titleAndMood.includes('beauty & skincare') ||
    titleAndMood.includes('cosmetic') ||
    titleAndMood.includes('hydra-luxe') ||
    titleAndMood.includes('facial oil') ||
    titleAndMood.includes('frosted glass') ||
    titleAndMood.includes('clean beauty')
  ) {
    return 'BEAUTY_SKINCARE';
  }

  // Tier 2: Relational categories linked to brief
  const categories = brief.categories || [];
  for (const cat of categories) {
    const slug = (cat.slug || '').toLowerCase();
    if (CATEGORY_SLUG_TO_DOMAIN[slug]) {
      return CATEGORY_SLUG_TO_DOMAIN[slug];
    }
  }

  // Tier 3: Brand Industry and Objective Context
  const fullCorpus = [
    titleAndMood,
    brief.campaign_objective || '',
    brief.brand?.company_name || '',
    brief.brand?.industry || '',
  ]
    .join(' ')
    .toLowerCase();

  if (fullCorpus.includes('music') || fullCorpus.includes('audio')) return 'MUSIC_AUDIO';
  if (fullCorpus.includes('automotive') || fullCorpus.includes('supercar')) return 'AUTOMOTIVE';
  if (fullCorpus.includes('food') || fullCorpus.includes('beverage') || fullCorpus.includes('coffee')) return 'FOOD_BEVERAGE';
  if (fullCorpus.includes('beauty') || fullCorpus.includes('skincare') || fullCorpus.includes('cosmetic')) return 'BEAUTY_SKINCARE';
  if (fullCorpus.includes('fashion') || fullCorpus.includes('apparel') || fullCorpus.includes('couture')) return 'FASHION_APPAREL';
  if (fullCorpus.includes('gaming') || fullCorpus.includes('rpg')) return 'GAMING';
  if (fullCorpus.includes('interior') || fullCorpus.includes('real estate') || fullCorpus.includes('architecture')) return 'HOME_INTERIOR_DESIGN';
  if (fullCorpus.includes('technology') || fullCorpus.includes('electronics') || fullCorpus.includes('wearables')) return 'TECHNOLOGY_GADGETS';
  if (fullCorpus.includes('film') || fullCorpus.includes('cinema')) return 'FILM_ENTERTAINMENT';
  if (fullCorpus.includes('fitness') || fullCorpus.includes('athletics')) return 'FITNESS_SPORTS';
  if (fullCorpus.includes('motion')) return 'MOTION_DESIGN';
  if (fullCorpus.includes('packaging')) return 'PACKAGING_INDUSTRIAL_DESIGN';
  if (fullCorpus.includes('ai art') || fullCorpus.includes('generative')) return 'AI_ART';

  // Fallback to primary creative domain
  return '3D_CGI';
}

/**
 * Calculates a stable, deterministic index for selecting an image from a domain.
 * Ensures:
 * 1. The same brief ALWAYS receives the exact same image across renders and screens.
 * 2. Different briefs in the same domain receive different images without repetition.
 *
 * @param {string|number} briefId - Unique brief identifier
 * @param {string} title - Brief title for additional entropy
 * @param {number} totalImages - Total number of available images in the domain
 * @returns {number} Selected image index (0 to totalImages - 1)
 */
export function getStableDomainImageIndex(briefId, title = '', totalImages = 1) {
  if (totalImages <= 1) return 0;

  const idStr = String(briefId || '');

  // Detect synthetic brief sequence number: e.g. "brief-synth-027" -> 27
  const synthMatch = idStr.match(/synth-(\d+)/i);
  if (synthMatch) {
    const num = parseInt(synthMatch[1], 10);
    const templateId = num % 20;
    const repId = Math.floor(num / 20);
    const titleSalt = hashString(title) % 11;
    return Math.abs((templateId * 11) + (repId * 3) + titleSalt) % totalImages;
  }

  // General deterministic hash using ID and title
  const idHash = hashString(idStr);
  const titleHash = hashString(title);
  const combined = idHash ^ (titleHash << 3);
  return Math.abs(combined) % totalImages;
}

/**
 * Returns the authoritative or deterministic campaign cover image for a brief.
 *
 * Priority:
 * 1. Brand uploaded reference asset or cover image (must be genuine /uploads/ or external URL,
 *    not legacy generic /assets/campaign-covers/... placeholders).
 * 2. Curated domain-specific visual asset from the brief's matching creative domain folder.
 * 3. Deterministic selection ensuring maximum variety across visible brief cards.
 * 4. Graceful neutral fallback image if domain has no usable images.
 *
 * @param {Object} brief - Campaign brief object
 * @param {number} fallbackIndex - Optional index fallback
 * @returns {string} URL to the brief cover image
 */
export function getBriefCoverImage(brief, fallbackIndex = 0) {
  if (!brief) return DEFAULT_FALLBACK_COVER;

  // 1. Check for genuine brand user uploads (e.g. from /uploads/ or external data/http URLs)
  const candidateUrl = (brief.reference_asset_url || brief.cover_image_url || '').trim();
  if (
    candidateUrl &&
    !candidateUrl.startsWith('/assets/campaign-covers/') &&
    (candidateUrl.startsWith('/uploads/') ||
      candidateUrl.startsWith('/api/uploads/') ||
      candidateUrl.startsWith('http://') ||
      candidateUrl.startsWith('https://') ||
      candidateUrl.startsWith('data:'))
  ) {
    return candidateUrl;
  }

  // 2. Authoritative 1-to-1 campaign brief mapped asset (171 bijective briefs)
  const mappedCampaignAsset = getCampaignBriefImage(brief);
  if (mappedCampaignAsset) {
    return mappedCampaignAsset;
  }

  // 2. Resolve the creative domain for this brief
  const domain = resolveBriefDomain(brief);
  const availableImages = DOMAIN_IMAGES[domain] || [];

  if (availableImages.length === 0) {
    // Check public fallback list
    const fallbacks = DOMAIN_PUBLIC_FALLBACKS[domain] || [];
    if (fallbacks.length > 0) {
      const idx = getStableDomainImageIndex(brief.id, brief.title, fallbacks.length);
      return fallbacks[idx] || fallbacks[0];
    }
    return DEFAULT_FALLBACK_COVER;
  }

  // 3. Select a deterministic, varied image from the matching domain
  const briefSeed = brief.id || `brief-${fallbackIndex}`;
  const imageIndex = getStableDomainImageIndex(briefSeed, brief.title, availableImages.length);

  return availableImages[imageIndex] || availableImages[0] || DEFAULT_FALLBACK_COVER;
}

/**
 * Returns all available image URLs for a specific domain folder.
 *
 * @param {string} domainFolder - Canonical domain folder name
 * @returns {string[]} Array of image URLs
 */
export function getDomainImages(domainFolder) {
  return DOMAIN_IMAGES[domainFolder] || [];
}

/**
 * Returns the human-readable display label for a domain folder.
 *
 * @param {string} domainFolder - Canonical domain folder name
 * @returns {string} Human-readable domain label (e.g. 'Food & Beverage')
 */
export function getDomainLabel(domainFolder) {
  return DOMAIN_LABELS[domainFolder] || domainFolder;
}
