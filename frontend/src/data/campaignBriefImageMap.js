/**
 * campaignBriefImageMap.js
 *
 * Centralized authoritative 1-to-1 mapping connecting all 171 Kivora campaign briefs
 * to unique curated PNG assets in `src/assets/campaign_briefs/` (001.png - 171.png).
 *
 * Key Features:
 * 1. Eager Vite glob bundling ensuring all 171 PNG assets are compiled into dist.
 * 2. 100% bijective 1-to-1 mapping (zero duplicate image assignments across briefs).
 * 3. Graceful fallback resolution for newly created or unmapped drafts.
 */

// 1. Eager Vite glob importing all 171 campaign brief PNG assets
export const CAMPAIGN_BRIEF_IMAGE_MODULES = import.meta.glob(
  '../assets/campaign_briefs/*.png',
  { eager: true, import: 'default' }
);

// 2. Helper to resolve bundled asset URL by filename (e.g. '042.png')
export function getBundledAssetUrl(filename) {
  if (!filename) return null;
  const key = `../assets/campaign_briefs/${filename}`;
  return CAMPAIGN_BRIEF_IMAGE_MODULES[key] || `/src/assets/campaign_briefs/${filename}`;
}

// 3. Canonical 1-to-1 brief ID to asset filename map (171 pairs)
export const CAMPAIGN_BRIEF_IMAGE_MAP = {
  'brief-7ee8f50f34': '019.png',
  'brief-apex-chronicles': '007.png',
  'brief-apex-soundtrack': '006.png',
  'brief-aurora-meta': '036.png',
  'brief-c9d26a8efc': '097.png',
  'brief-lumina-dewdrop': '071.png',
  'brief-lumina-packaging': '072.png',
  'brief-synth-001': '077.png',
  'brief-synth-002': '005.png',
  'brief-synth-003': '016.png',
  'brief-synth-004': '008.png',
  'brief-synth-005': '075.png',
  'brief-synth-006': '001.png',
  'brief-synth-007': '018.png',
  'brief-synth-008': '011.png',
  'brief-synth-009': '028.png',
  'brief-synth-010': '003.png',
  'brief-synth-011': '159.png',
  'brief-synth-012': '012.png',
  'brief-synth-013': '015.png',
  'brief-synth-014': '002.png',
  'brief-synth-015': '013.png',
  'brief-synth-016': '009.png',
  'brief-synth-017': '020.png',
  'brief-synth-018': '017.png',
  'brief-synth-019': '156.png',
  'brief-synth-020': '031.png',
  'brief-synth-021': '033.png',
  'brief-synth-022': '038.png',
  'brief-synth-023': '111.png',
  'brief-synth-024': '024.png',
  'brief-synth-025': '166.png',
  'brief-synth-026': '035.png',
  'brief-synth-027': '131.png',
  'brief-synth-028': '027.png',
  'brief-synth-029': '025.png',
  'brief-synth-030': '152.png',
  'brief-synth-031': '085.png',
  'brief-synth-032': '040.png',
  'brief-synth-033': '169.png',
  'brief-synth-034': '029.png',
  'brief-synth-035': '050.png',
  'brief-synth-036': '030.png',
  'brief-synth-037': '026.png',
  'brief-synth-038': '004.png',
  'brief-synth-039': '039.png',
  'brief-synth-040': '021.png',
  'brief-synth-041': '043.png',
  'brief-synth-042': '092.png',
  'brief-synth-043': '049.png',
  'brief-synth-044': '144.png',
  'brief-synth-045': '044.png',
  'brief-synth-046': '057.png',
  'brief-synth-047': '109.png',
  'brief-synth-048': '058.png',
  'brief-synth-049': '045.png',
  'brief-synth-050': '053.png',
  'brief-synth-051': '051.png',
  'brief-synth-052': '059.png',
  'brief-synth-053': '060.png',
  'brief-synth-054': '054.png',
  'brief-synth-055': '129.png',
  'brief-synth-056': '055.png',
  'brief-synth-057': '047.png',
  'brief-synth-058': '154.png',
  'brief-synth-059': '048.png',
  'brief-synth-060': '056.png',
  'brief-synth-061': '165.png',
  'brief-synth-062': '064.png',
  'brief-synth-063': '082.png',
  'brief-synth-064': '065.png',
  'brief-synth-065': '074.png',
  'brief-synth-066': '073.png',
  'brief-synth-067': '041.png',
  'brief-synth-068': '068.png',
  'brief-synth-069': '080.png',
  'brief-synth-070': '090.png',
  'brief-synth-071': '142.png',
  'brief-synth-072': '148.png',
  'brief-synth-073': '101.png',
  'brief-synth-074': '014.png',
  'brief-synth-075': '107.png',
  'brief-synth-076': '067.png',
  'brief-synth-077': '161.png',
  'brief-synth-078': '062.png',
  'brief-synth-079': '110.png',
  'brief-synth-080': '070.png',
  'brief-synth-081': '078.png',
  'brief-synth-082': '099.png',
  'brief-synth-083': '128.png',
  'brief-synth-084': '037.png',
  'brief-synth-085': '100.png',
  'brief-synth-086': '150.png',
  'brief-synth-087': '086.png',
  'brief-synth-088': '094.png',
  'brief-synth-089': '168.png',
  'brief-synth-090': '061.png',
  'brief-synth-091': '113.png',
  'brief-synth-092': '095.png',
  'brief-synth-093': '034.png',
  'brief-synth-094': '088.png',
  'brief-synth-095': '158.png',
  'brief-synth-096': '145.png',
  'brief-synth-097': '102.png',
  'brief-synth-098': '091.png',
  'brief-synth-099': '081.png',
  'brief-synth-100': '149.png',
  'brief-synth-101': '133.png',
  'brief-synth-102': '118.png',
  'brief-synth-103': '106.png',
  'brief-synth-104': '119.png',
  'brief-synth-105': '135.png',
  'brief-synth-106': '115.png',
  'brief-synth-107': '114.png',
  'brief-synth-108': '010.png',
  'brief-synth-109': '079.png',
  'brief-synth-110': '153.png',
  'brief-synth-111': '130.png',
  'brief-synth-112': '032.png',
  'brief-synth-113': '022.png',
  'brief-synth-114': '151.png',
  'brief-synth-115': '084.png',
  'brief-synth-116': '120.png',
  'brief-synth-117': '170.png',
  'brief-synth-118': '117.png',
  'brief-synth-119': '104.png',
  'brief-synth-120': '096.png',
  'brief-synth-121': '132.png',
  'brief-synth-122': '126.png',
  'brief-synth-123': '157.png',
  'brief-synth-124': '023.png',
  'brief-synth-125': '134.png',
  'brief-synth-126': '087.png',
  'brief-synth-127': '143.png',
  'brief-synth-128': '147.png',
  'brief-synth-129': '137.png',
  'brief-synth-130': '123.png',
  'brief-synth-131': '108.png',
  'brief-synth-132': '140.png',
  'brief-synth-133': '138.png',
  'brief-synth-134': '122.png',
  'brief-synth-135': '112.png',
  'brief-synth-136': '093.png',
  'brief-synth-137': '139.png',
  'brief-synth-138': '125.png',
  'brief-synth-139': '127.png',
  'brief-synth-140': '136.png',
  'brief-synth-141': '076.png',
  'brief-synth-142': '155.png',
  'brief-synth-143': '083.png',
  'brief-synth-144': '066.png',
  'brief-synth-145': '167.png',
  'brief-synth-146': '121.png',
  'brief-synth-147': '042.png',
  'brief-synth-148': '160.png',
  'brief-synth-149': '116.png',
  'brief-synth-150': '124.png',
  'brief-synth-151': '052.png',
  'brief-synth-152': '069.png',
  'brief-synth-153': '046.png',
  'brief-synth-154': '089.png',
  'brief-synth-155': '141.png',
  'brief-synth-156': '146.png',
  'brief-synth-157': '103.png',
  'brief-synth-158': '063.png',
  'brief-synth-159': '105.png',
  'brief-synth-160': '098.png',
  'brief-vitality-elixir': '162.png',
  'brief-volt-hypercar': '164.png',
  'brief-volt-interior': '163.png',
  'brief-zenith-explainer': '171.png',
};

/**
 * Resolves the campaign brief image for a given brief object or ID.
 * Checks the authoritative 171 map first, then checks genuine user uploads,
 * and finally falls back to null (allowing caller fallback).
 *
 * @param {Object|string} brief - Campaign brief object or brief ID string
 * @returns {string|null} Resolved image URL or null
 */
export function getCampaignBriefImage(brief) {
  if (!brief) return null;
  const briefId = typeof brief === 'string' ? brief : brief.id;
  
  // 1. Authoritative 1-to-1 mapping
  if (briefId && CAMPAIGN_BRIEF_IMAGE_MAP[briefId]) {
    const filename = CAMPAIGN_BRIEF_IMAGE_MAP[briefId];
    return getBundledAssetUrl(filename);
  }
  
  // 2. Genuine brand uploaded reference/cover asset (e.g. from /uploads/ or external URL)
  if (typeof brief === 'object') {
    const candidateUrl = (brief.reference_asset_url || brief.cover_image_url || '').trim();
    if (
      candidateUrl &&
      !candidateUrl.startsWith('/assets/campaign-covers/') &&
      (candidateUrl.startsWith('/uploads/') ||
        candidateUrl.startsWith('http://') ||
        candidateUrl.startsWith('https://') ||
        candidateUrl.startsWith('data:'))
    ) {
      return candidateUrl;
    }
  }
  
  return null;
}

export default CAMPAIGN_BRIEF_IMAGE_MAP;
