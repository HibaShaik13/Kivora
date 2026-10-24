/**
 * visualAssetHelpers.js
 *
 * Deterministic visual asset resolver for Kivora creators, brands, and campaign briefs.
 * Ensures consistent, high-aesthetic visuals across cards, modals, messaging, and exploration views.
 */

// Vite asset glob to ensure all 90 creator profile portraits are bundled and tracked by Vite
export const CREATOR_PROFILE_MODULES = import.meta.glob('../assets/creators_profiles/*.jpg', {
  eager: true,
  import: 'default',
});

// Confirmed manifest mapping: normalized names, creator IDs, handles, and filenames to bespoke portraits
export const CREATOR_PROFILE_MAP = {
  // Localized Indian Creator Personas
  'aanyasharma': '/assets/creator-portraits/elena.jpg',
  'aanya_creative': '/assets/creator-portraits/elena.jpg',
  'aanya': '/assets/creator-portraits/elena.jpg',
  'arjunmehta': '/assets/creator-portraits/marcus.jpg',
  'mehta_3d': '/assets/creator-portraits/marcus.jpg',
  'arjun': '/assets/creator-portraits/marcus.jpg',
  'kabirnair': '/assets/creator-portraits/kai.jpg',
  'kabir_visuals': '/assets/creator-portraits/kai.jpg',
  'kabir': '/assets/creator-portraits/kai.jpg',
  'meerakrishnan': '/assets/creator-portraits/maya.jpg',
  'meera_fashion': '/assets/creator-portraits/maya.jpg',
  'meera': '/assets/creator-portraits/maya.jpg',
  'adityaverma': '/assets/creator-portraits/alex.jpg',
  'averma_motion': '/assets/creator-portraits/alex.jpg',
  'aditya': '/assets/creator-portraits/alex.jpg',
  'zoyaqureshi': '/assets/creator-portraits/zara.jpg',
  'zoya_concept': '/assets/creator-portraits/zara.jpg',
  'zoya': '/assets/creator-portraits/zara.jpg',
  'dhruvkapoor': '/assets/creator-portraits/devon.jpg',
  'dhruv_sound_vis': '/assets/creator-portraits/devon.jpg',
  'dhruv': '/assets/creator-portraits/devon.jpg',
  'sanyamalhotra': '/assets/creator-portraits/sophia.jpg',
  'sanya_beauty': '/assets/creator-portraits/sophia.jpg',
  'sanya': '/assets/creator-portraits/sophia.jpg',
  'tariqfarooqi': '/assets/creator-portraits/tariq.jpg',
  'charvireddy': '/assets/creator-portraits/chloe.jpg',
  'charvi_vfx': '/assets/creator-portraits/chloe.jpg',
  'charvi': '/assets/creator-portraits/chloe.jpg',
  'lakshyapatel': '/assets/creator-portraits/liam.jpg',
  'lakshya_games': '/assets/creator-portraits/liam.jpg',
  'lakshya': '/assets/creator-portraits/liam.jpg',
  'hassansiddiqui': '/assets/creator-portraits/hassan.jpg',
  'niharikajoshi': '/assets/creator-portraits/nora.jpg',
  'niharika_design': '/assets/creator-portraits/nora.jpg',
  'niharika': '/assets/creator-portraits/nora.jpg',

  'alexrivera': '/assets/creators_profiles/alex_rivera.jpg',
  'creator-alex-rivera': '/assets/creators_profiles/alex_rivera.jpg',
  'alex_rivera.jpg': '/assets/creators_profiles/alex_rivera.jpg',
  'alinamorin': '/assets/creators_profiles/alina_morin.jpg',
  'cr-synth-027': '/assets/creators_profiles/alina_morin.jpg',
  'alina_morin.jpg': '/assets/creators_profiles/alina_morin.jpg',
  'alinanakamura': '/assets/creators_profiles/alina_nakamura.jpg',
  'cr-synth-077': '/assets/creators_profiles/alina_nakamura.jpg',
  'alina_nakamura.jpg': '/assets/creators_profiles/alina_nakamura.jpg',
  'amaracross': '/assets/creators_profiles/amara_cross.jpg',
  'cr-synth-061': '/assets/creators_profiles/amara_cross.jpg',
  'amara_cross.jpg': '/assets/creators_profiles/amara_cross.jpg',
  'amararousseau': '/assets/creators_profiles/amara_rousseau.jpg',
  'cr-synth-011': '/assets/creators_profiles/amara_rousseau.jpg',
  'amara_rousseau.jpg': '/assets/creators_profiles/amara_rousseau.jpg',
  'ananyaito': '/assets/creators_profiles/ananya_ito.jpg',
  'cr-synth-096': '/assets/creators_profiles/ananya_ito.jpg',
  'ananya_ito.jpg': '/assets/creators_profiles/ananya_ito.jpg',
  'ananyasharma': '/assets/creators_profiles/ananya_sharma.jpg',
  'creator-ananya-sharma': '/assets/creators_profiles/ananya_sharma.jpg',
  'ananya_sharma.jpg': '/assets/creators_profiles/ananya_sharma.jpg',
  'ananyasinclair': '/assets/creators_profiles/ananya_sinclair.jpg',
  'cr-synth-046': '/assets/creators_profiles/ananya_sinclair.jpg',
  'ananya_sinclair.jpg': '/assets/creators_profiles/ananya_sinclair.jpg',
  'ariaashford': '/assets/creators_profiles/aria_ashford.jpg',
  'cr-synth-101': '/assets/creators_profiles/aria_ashford.jpg',
  'aria_ashford.jpg': '/assets/creators_profiles/aria_ashford.jpg',
  'arianovak': '/assets/creators_profiles/aria_novak.jpg',
  'cr-synth-051': '/assets/creators_profiles/aria_novak.jpg',
  'aria_novak.jpg': '/assets/creators_profiles/aria_novak.jpg',
  'ariavance': '/assets/creators_profiles/aria_vance.jpg',
  'cr-synth-001': '/assets/creators_profiles/aria_vance.jpg',
  'aria_vance.jpg': '/assets/creators_profiles/aria_vance.jpg',
  'astridkovacs': '/assets/creators_profiles/astrid_kovacs.jpg',
  'cr-synth-066': '/assets/creators_profiles/astrid_kovacs.jpg',
  'astrid_kovacs.jpg': '/assets/creators_profiles/astrid_kovacs.jpg',
  'astridvalenti': '/assets/creators_profiles/astrid_valenti.jpg',
  'cr-synth-016': '/assets/creators_profiles/astrid_valenti.jpg',
  'astrid_valenti.jpg': '/assets/creators_profiles/astrid_valenti.jpg',
  'brynsinclair': '/assets/creators_profiles/bryn_sinclair.jpg',
  'cr-synth-078': '/assets/creators_profiles/bryn_sinclair.jpg',
  'bryn_sinclair.jpg': '/assets/creators_profiles/bryn_sinclair.jpg',
  'brynthorne': '/assets/creators_profiles/bryn_thorne.jpg',
  'cr-synth-028': '/assets/creators_profiles/bryn_thorne.jpg',
  'bryn_thorne.jpg': '/assets/creators_profiles/bryn_thorne.jpg',
  'callumbrandt': '/assets/creators_profiles/callum_brandt.jpg',
  'cr-synth-022': '/assets/creators_profiles/callum_brandt.jpg',
  'callum_brandt.jpg': '/assets/creators_profiles/callum_brandt.jpg',
  'callumvargas': '/assets/creators_profiles/callum_vargas.jpg',
  'cr-synth-072': '/assets/creators_profiles/callum_vargas.jpg',
  'callum_vargas.jpg': '/assets/creators_profiles/callum_vargas.jpg',
  'cassianbergman': '/assets/creators_profiles/cassian_bergman.jpg',
  'cr-synth-039': '/assets/creators_profiles/cassian_bergman.jpg',
  'cassian_bergman.jpg': '/assets/creators_profiles/cassian_bergman.jpg',
  'cassiancastillo': '/assets/creators_profiles/cassian_castillo.jpg',
  'cr-synth-089': '/assets/creators_profiles/cassian_castillo.jpg',
  'cassian_castillo.jpg': '/assets/creators_profiles/cassian_castillo.jpg',
  'chloebergman': '/assets/creators_profiles/chloe_bergman.jpg',
  'cr-synth-007': '/assets/creators_profiles/chloe_bergman.jpg',
  'chloe_bergman.jpg': '/assets/creators_profiles/chloe_bergman.jpg',
  'chloecastillo': '/assets/creators_profiles/chloe_castillo.jpg',
  'cr-synth-057': '/assets/creators_profiles/chloe_castillo.jpg',
  'chloe_castillo.jpg': '/assets/creators_profiles/chloe_castillo.jpg',
  'chloedupont': '/assets/creators_profiles/chloe_dupont.jpg',
  'creator-chloe-dupont': '/assets/creators_profiles/chloe_dupont.jpg',
  'chloe_dupont.jpg': '/assets/creators_profiles/chloe_dupont.jpg',
  'chloédupont': '/assets/creators_profiles/chloe_dupont.jpg',
  'corinhawthorne': '/assets/creators_profiles/corin_hawthorne.jpg',
  'cr-synth-047': '/assets/creators_profiles/corin_hawthorne.jpg',
  'corin_hawthorne.jpg': '/assets/creators_profiles/corin_hawthorne.jpg',
  'corinvance': '/assets/creators_profiles/corin_vance.jpg',
  'cr-synth-097': '/assets/creators_profiles/corin_vance.jpg',
  'corin_vance.jpg': '/assets/creators_profiles/corin_vance.jpg',
  'cyruscross': '/assets/creators_profiles/cyrus_cross.jpg',
  'cr-synth-029': '/assets/creators_profiles/cyrus_cross.jpg',
  'cyrus_cross.jpg': '/assets/creators_profiles/cyrus_cross.jpg',
  'cyrushawthorne': '/assets/creators_profiles/cyrus_hawthorne.jpg',
  'cr-synth-079': '/assets/creators_profiles/cyrus_hawthorne.jpg',
  'cyrus_hawthorne.jpg': '/assets/creators_profiles/cyrus_hawthorne.jpg',
  'danteito': '/assets/creators_profiles/dante_ito.jpg',
  'cr-synth-064': '/assets/creators_profiles/dante_ito.jpg',
  'dante_ito.jpg': '/assets/creators_profiles/dante_ito.jpg',
  'dantesinclair': '/assets/creators_profiles/dante_sinclair.jpg',
  'cr-synth-014': '/assets/creators_profiles/dante_sinclair.jpg',
  'dante_sinclair.jpg': '/assets/creators_profiles/dante_sinclair.jpg',
  'daphneholloway': '/assets/creators_profiles/daphne_holloway.jpg',
  'cr-synth-082': '/assets/creators_profiles/daphne_holloway.jpg',
  'daphne_holloway.jpg': '/assets/creators_profiles/daphne_holloway.jpg',
  'daphneito': '/assets/creators_profiles/daphne_ito.jpg',
  'cr-synth-032': '/assets/creators_profiles/daphne_ito.jpg',
  'daphne_ito.jpg': '/assets/creators_profiles/daphne_ito.jpg',
  'devonross': '/assets/creators_profiles/devon_ross.jpg',
  'creator-devon-ross': '/assets/creators_profiles/devon_ross.jpg',
  'devon_ross.jpg': '/assets/creators_profiles/devon_ross.jpg',
  'edenkallio': '/assets/creators_profiles/eden_kallio.jpg',
  'cr-synth-084': '/assets/creators_profiles/eden_kallio.jpg',
  'eden_kallio.jpg': '/assets/creators_profiles/eden_kallio.jpg',
  'edenkovacs': '/assets/creators_profiles/eden_kovacs.jpg',
  'cr-synth-034': '/assets/creators_profiles/eden_kovacs.jpg',
  'eden_kovacs.jpg': '/assets/creators_profiles/eden_kovacs.jpg',
  'elenarostova': '/assets/creator-portraits/elena.jpg',
  'creator-elena-rostova': '/assets/creator-portraits/elena.jpg',
  'elena_rostova.jpg': '/assets/creator-portraits/elena.jpg',
  'elodiekovacs': '/assets/creators_profiles/elodie_kovacs.jpg',
  'cr-synth-098': '/assets/creators_profiles/elodie_kovacs.jpg',
  'elodie_kovacs.jpg': '/assets/creators_profiles/elodie_kovacs.jpg',
  'elodievalenti': '/assets/creators_profiles/elodie_valenti.jpg',
  'cr-synth-048': '/assets/creators_profiles/elodie_valenti.jpg',
  'elodie_valenti.jpg': '/assets/creators_profiles/elodie_valenti.jpg',
  'ezrabergman': '/assets/creators_profiles/ezra_bergman.jpg',
  'cr-synth-071': '/assets/creators_profiles/ezra_bergman.jpg',
  'ezra_bergman.jpg': '/assets/creators_profiles/ezra_bergman.jpg',
  'ezrafairchild': '/assets/creators_profiles/ezra_fairchild.jpg',
  'cr-synth-021': '/assets/creators_profiles/ezra_fairchild.jpg',
  'ezra_fairchild.jpg': '/assets/creators_profiles/ezra_fairchild.jpg',
  'felixalthaus': '/assets/creators_profiles/felix_althaus.jpg',
  'cr-synth-041': '/assets/creators_profiles/felix_althaus.jpg',
  'felix_althaus.jpg': '/assets/creators_profiles/felix_althaus.jpg',
  'felixmorin': '/assets/creators_profiles/felix_morin.jpg',
  'cr-synth-091': '/assets/creators_profiles/felix_morin.jpg',
  'felix_morin.jpg': '/assets/creators_profiles/felix_morin.jpg',
  'finnlindqvist': '/assets/creators_profiles/finn_lindqvist.jpg',
  'cr-synth-024': '/assets/creators_profiles/finn_lindqvist.jpg',
  'finn_lindqvist.jpg': '/assets/creators_profiles/finn_lindqvist.jpg',
  'finnmontague': '/assets/creators_profiles/finn_montague.jpg',
  'cr-synth-074': '/assets/creators_profiles/finn_montague.jpg',
  'finn_montague.jpg': '/assets/creators_profiles/finn_montague.jpg',
  'frejaalthaus': '/assets/creators_profiles/freja_althaus.jpg',
  'cr-synth-009': '/assets/creators_profiles/freja_althaus.jpg',
  'freja_althaus.jpg': '/assets/creators_profiles/freja_althaus.jpg',
  'frejamorin': '/assets/creators_profiles/freja_morin.jpg',
  'cr-synth-059': '/assets/creators_profiles/freja_morin.jpg',
  'freja_morin.jpg': '/assets/creators_profiles/freja_morin.jpg',
  'gabedavenport': '/assets/creators_profiles/gabe_davenport.jpg',
  'cr-synth-031': '/assets/creators_profiles/gabe_davenport.jpg',
  'gabe_davenport.jpg': '/assets/creators_profiles/gabe_davenport.jpg',
  'gabefontaine': '/assets/creators_profiles/gabe_fontaine.jpg',
  'cr-synth-081': '/assets/creators_profiles/gabe_fontaine.jpg',
  'gabe_fontaine.jpg': '/assets/creators_profiles/gabe_fontaine.jpg',
  'hassankhalil': '/assets/creators_profiles/hassan_khalil.jpg',
  'creator-hassan-khalil': '/assets/creators_profiles/hassan_khalil.jpg',
  'hassan_khalil.jpg': '/assets/creators_profiles/hassan_khalil.jpg',
  'hiba': '/assets/creators_profiles/hiba.jpg',
  'cr-7db989c3ae99': '/assets/creators_profiles/hiba.jpg',
  'hiba.jpg': '/assets/creators_profiles/hiba.jpg',
  'inezmontague': '/assets/creators_profiles/inez_montague.jpg',
  'cr-synth-042': '/assets/creators_profiles/inez_montague.jpg',
  'inez_montague.jpg': '/assets/creators_profiles/inez_montague.jpg',
  'inezthorne': '/assets/creators_profiles/inez_thorne.jpg',
  'cr-synth-092': '/assets/creators_profiles/inez_thorne.jpg',
  'inez_thorne.jpg': '/assets/creators_profiles/inez_thorne.jpg',
  'jonascross': '/assets/creators_profiles/jonas_cross.jpg',
  'cr-synth-093': '/assets/creators_profiles/jonas_cross.jpg',
  'jonas_cross.jpg': '/assets/creators_profiles/jonas_cross.jpg',
  'jonasrousseau': '/assets/creators_profiles/jonas_rousseau.jpg',
  'cr-synth-043': '/assets/creators_profiles/jonas_rousseau.jpg',
  'jonas_rousseau.jpg': '/assets/creators_profiles/jonas_rousseau.jpg',
  'julianchen': '/assets/creators_profiles/julian_chen.jpg',
  'cr-synth-006': '/assets/creators_profiles/julian_chen.jpg',
  'julian_chen.jpg': '/assets/creators_profiles/julian_chen.jpg',
  'julianlindqvist': '/assets/creators_profiles/julian_lindqvist.jpg',
  'cr-synth-056': '/assets/creators_profiles/julian_lindqvist.jpg',
  'julian_lindqvist.jpg': '/assets/creators_profiles/julian_lindqvist.jpg',
  'kaelenholloway': '/assets/creators_profiles/kaelen_holloway.jpg',
  'cr-synth-050': '/assets/creators_profiles/kaelen_holloway.jpg',
  'kaelen_holloway.jpg': '/assets/creators_profiles/kaelen_holloway.jpg',
  'kaelenwinter': '/assets/creators_profiles/kaelen_winter.jpg',
  'cr-synth-100': '/assets/creators_profiles/kaelen_winter.jpg',
  'kaelen_winter.jpg': '/assets/creators_profiles/kaelen_winter.jpg',
  'kaichen': '/assets/creators_profiles/kai_chen.jpg',
  'cr-synth-102': '/assets/creators_profiles/kai_chen.jpg',
  'kai_chen.jpg': '/assets/creators_profiles/kai_chen.jpg',
  'kaikallio': '/assets/creators_profiles/kai_kallio.jpg',
  'cr-synth-052': '/assets/creators_profiles/kai_kallio.jpg',
  'kai_kallio.jpg': '/assets/creators_profiles/kai_kallio.jpg',
  'kaikovacs': '/assets/creators_profiles/kai_kovacs.jpg',
  'cr-synth-002': '/assets/creators_profiles/kai_kovacs.jpg',
  'kai_kovacs.jpg': '/assets/creators_profiles/kai_kovacs.jpg',
  'kaitanaka': '/assets/creators_profiles/kai_tanaka.jpg',
  'creator-kai-tanaka': '/assets/creators_profiles/kai_tanaka.jpg',
  'kai_tanaka.jpg': '/assets/creators_profiles/kai_tanaka.jpg',
  'kenjimontague': '/assets/creators_profiles/kenji_montague.jpg',
  'cr-synth-010': '/assets/creators_profiles/kenji_montague.jpg',
  'kenji_montague.jpg': '/assets/creators_profiles/kenji_montague.jpg',
  'kenjithorne': '/assets/creators_profiles/kenji_thorne.jpg',
  'cr-synth-060': '/assets/creators_profiles/kenji_thorne.jpg',
  'kenji_thorne.jpg': '/assets/creators_profiles/kenji_thorne.jpg',
  'kirasutherland': '/assets/creators_profiles/kira_sutherland.jpg',
  'cr-synth-030': '/assets/creators_profiles/kira_sutherland.jpg',
  'kira_sutherland.jpg': '/assets/creators_profiles/kira_sutherland.jpg',
  'kiravalenti': '/assets/creators_profiles/kira_valenti.jpg',
  'cr-synth-080': '/assets/creators_profiles/kira_valenti.jpg',
  'kira_valenti.jpg': '/assets/creators_profiles/kira_valenti.jpg',
  'leiladavenport': '/assets/creators_profiles/leila_davenport.jpg',
  'cr-synth-063': '/assets/creators_profiles/leila_davenport.jpg',
  'leila_davenport.jpg': '/assets/creators_profiles/leila_davenport.jpg',
  'leilanakamura': '/assets/creators_profiles/leila_nakamura.jpg',
  'cr-synth-013': '/assets/creators_profiles/leila_nakamura.jpg',
  'leila_nakamura.jpg': '/assets/creators_profiles/leila_nakamura.jpg',
  'leosolano': '/assets/creators_profiles/leo_solano.jpg',
  'cr-synth-058': '/assets/creators_profiles/leo_solano.jpg',
  'leo_solano.jpg': '/assets/creators_profiles/leo_solano.jpg',
  'leovargas': '/assets/creators_profiles/leo_vargas.jpg',
  'cr-synth-008': '/assets/creators_profiles/leo_vargas.jpg',
  'leo_vargas.jpg': '/assets/creators_profiles/leo_vargas.jpg',
  'liamobrien': '/assets/creators_profiles/liam_o_brien.jpg',
  'creator-liam-obrien': '/assets/creators_profiles/liam_o_brien.jpg',
  'liam_o_brien.jpg': '/assets/creators_profiles/liam_o_brien.jpg',
  'lucianashford': '/assets/creators_profiles/lucian_ashford.jpg',
  'cr-synth-037': '/assets/creators_profiles/lucian_ashford.jpg',
  'lucian_ashford.jpg': '/assets/creators_profiles/lucian_ashford.jpg',
  'luciansterling': '/assets/creators_profiles/lucian_sterling.jpg',
  'cr-synth-087': '/assets/creators_profiles/lucian_sterling.jpg',
  'lucian_sterling.jpg': '/assets/creators_profiles/lucian_sterling.jpg',
  'lyrasolano': '/assets/creators_profiles/lyra_solano.jpg',
  'cr-synth-090': '/assets/creators_profiles/lyra_solano.jpg',
  'lyra_solano.jpg': '/assets/creators_profiles/lyra_solano.jpg',
  'lyravargas': '/assets/creators_profiles/lyra_vargas.jpg',
  'cr-synth-040': '/assets/creators_profiles/lyra_vargas.jpg',
  'lyra_vargas.jpg': '/assets/creators_profiles/lyra_vargas.jpg',
  'marcusvance': '/assets/creators_profiles/marcus_vance.jpg',
  'creator-marcus-vance': '/assets/creators_profiles/marcus_vance.jpg',
  'marcus_vance.jpg': '/assets/creators_profiles/marcus_vance.jpg',
  'mateobrandt': '/assets/creators_profiles/mateo_brandt.jpg',
  'cr-synth-054': '/assets/creators_profiles/mateo_brandt.jpg',
  'mateo_brandt.jpg': '/assets/creators_profiles/mateo_brandt.jpg',
  'mateovargas': '/assets/creators_profiles/mateo_vargas.jpg',
  'cr-synth-104': '/assets/creators_profiles/mateo_vargas.jpg',
  'mateo_vargas.jpg': '/assets/creators_profiles/mateo_vargas.jpg',
  'mateowinter': '/assets/creators_profiles/mateo_winter.jpg',
  'cr-synth-004': '/assets/creators_profiles/mateo_winter.jpg',
  'mateo_winter.jpg': '/assets/creators_profiles/mateo_winter.jpg',
  'mayaholloway': '/assets/creators_profiles/maya_holloway.jpg',
  'cr-synth-018': '/assets/creators_profiles/maya_holloway.jpg',
  'maya_holloway.jpg': '/assets/creators_profiles/maya_holloway.jpg',
  'mayalin': '/assets/creators_profiles/maya_lin.jpg',
  'creator-maya-lin': '/assets/creators_profiles/maya_lin.jpg',
  'maya_lin.jpg': '/assets/creators_profiles/maya_lin.jpg',
  'mayawinter': '/assets/creators_profiles/maya_winter.jpg',
  'cr-synth-068': '/assets/creators_profiles/maya_winter.jpg',
  'maya_winter.jpg': '/assets/creators_profiles/maya_winter.jpg',
  'mirahawthorne': '/assets/creators_profiles/mira_hawthorne.jpg',
  'cr-synth-015': '/assets/creators_profiles/mira_hawthorne.jpg',
  'mira_hawthorne.jpg': '/assets/creators_profiles/mira_hawthorne.jpg',
  'miravance': '/assets/creators_profiles/mira_vance.jpg',
  'cr-synth-065': '/assets/creators_profiles/mira_vance.jpg',
  'mira_vance.jpg': '/assets/creators_profiles/mira_vance.jpg',
  'naiachen': '/assets/creators_profiles/naia_chen.jpg',
  'cr-synth-038': '/assets/creators_profiles/naia_chen.jpg',
  'naia_chen.jpg': '/assets/creators_profiles/naia_chen.jpg',
  'naialindqvist': '/assets/creators_profiles/naia_lindqvist.jpg',
  'cr-synth-088': '/assets/creators_profiles/naia_lindqvist.jpg',
  'naia_lindqvist.jpg': '/assets/creators_profiles/naia_lindqvist.jpg',
  'nicomercer': '/assets/creators_profiles/nico_mercer.jpg',
  'cr-synth-012': '/assets/creators_profiles/nico_mercer.jpg',
  'nico_mercer.jpg': '/assets/creators_profiles/nico_mercer.jpg',
  'nicosutherland': '/assets/creators_profiles/nico_sutherland.jpg',
  'cr-synth-062': '/assets/creators_profiles/nico_sutherland.jpg',
  'nico_sutherland.jpg': '/assets/creators_profiles/nico_sutherland.jpg',
  'noralindqvist': '/assets/creators_profiles/nora_lindqvist.jpg',
  'creator-nora-lindqvist': '/assets/creators_profiles/nora_lindqvist.jpg',
  'nora_lindqvist.jpg': '/assets/creators_profiles/nora_lindqvist.jpg',
  'priyaalthaus': '/assets/creators_profiles/priya_althaus.jpg',
  'cr-synth-073': '/assets/creators_profiles/priya_althaus.jpg',
  'priya_althaus.jpg': '/assets/creators_profiles/priya_althaus.jpg',
  'priyasterling': '/assets/creators_profiles/priya_sterling.jpg',
  'cr-synth-023': '/assets/creators_profiles/priya_sterling.jpg',
  'priya_sterling.jpg': '/assets/creators_profiles/priya_sterling.jpg',
  'reiddubois': '/assets/creators_profiles/reid_dubois.jpg',
  'cr-synth-035': '/assets/creators_profiles/reid_dubois.jpg',
  'reid_dubois.jpg': '/assets/creators_profiles/reid_dubois.jpg',
};


export const DEFAULT_FALLBACK_AVATAR = '/assets/creator-portraits/devon.jpg';

export const CURATED_CREATOR_PORTRAITS = [
  '/assets/creator-portraits/portrait_ai_artist.jpg',
  '/assets/creator-portraits/portrait_fashion_creator.jpg',
  '/assets/creator-portraits/portrait_automotive_designer.jpg',
  '/assets/creator-portraits/portrait_cgi_artist.jpg',
  '/assets/creator-portraits/portrait_beauty_filmmaker.jpg',
  '/assets/creator-portraits/alex.jpg',
  '/assets/creator-portraits/ananya.jpg',
  '/assets/creator-portraits/chloe.jpg',
  '/assets/creator-portraits/devon.jpg',
  '/assets/creator-portraits/elena.jpg',
  '/assets/creator-portraits/hassan.jpg',
  '/assets/creator-portraits/kai.jpg',
  '/assets/creator-portraits/liam.jpg',
  '/assets/creator-portraits/marcus.jpg',
  '/assets/creator-portraits/maya.jpg',
  '/assets/creator-portraits/nora.jpg',
  '/assets/creator-portraits/sophia.jpg',
  '/assets/creator-portraits/tariq.jpg',
  '/assets/creator-portraits/zara.jpg',
];

export const CAMPAIGN_THEME_COVERS = {
  skincare: '/assets/campaign-covers/brand_skincare_cover.jpg',
  beauty: '/assets/campaign-covers/brand_skincare_cover.jpg',
  fragrance: '/assets/campaign-covers/brand_fragrance_cover.jpg',
  perfume: '/assets/campaign-covers/brand_fragrance_cover.jpg',
  automotive: '/assets/campaign-covers/brand_automotive_cover.jpg',
  car: '/assets/campaign-covers/brand_automotive_cover.jpg',
  fashion: '/assets/campaign-covers/brand_fashion_cover.jpg',
  luxury: '/assets/campaign-covers/brand_fashion_cover.jpg',
  technology: '/assets/campaign-covers/brand_technology_cover.jpg',
  audio: '/assets/campaign-covers/brand_technology_cover.jpg',
  hardware: '/assets/campaign-covers/brand_technology_cover.jpg',
  gaming: '/assets/campaign-covers/brand_gaming_cover.jpg',
  entertainment: '/assets/campaign-covers/brand_gaming_cover.jpg',
  beverage: '/assets/campaign-covers/brand_beverage_cover.jpg',
  wellness: '/assets/campaign-covers/brand_beverage_cover.jpg',
  health: '/assets/campaign-covers/brand_beverage_cover.jpg',
  architecture: '/assets/campaign-covers/brand_architecture_cover.jpg',
  spatial: '/assets/campaign-covers/brand_architecture_cover.jpg',
};

const DEFAULT_CAMPAIGN_COVERS = [
  '/assets/campaign-covers/brand_skincare_cover.jpg',
  '/assets/campaign-covers/brand_fragrance_cover.jpg',
  '/assets/campaign-covers/brand_automotive_cover.jpg',
  '/assets/campaign-covers/brand_fashion_cover.jpg',
  '/assets/campaign-covers/brand_technology_cover.jpg',
  '/assets/campaign-covers/brand_gaming_cover.jpg',
  '/assets/campaign-covers/brand_beverage_cover.jpg',
  '/assets/campaign-covers/brand_architecture_cover.jpg',
  '/assets/campaign-covers/sophia_cellular_dew_thumb.jpg',
  '/assets/campaign-covers/marcus_aura_droplet.jpg',
  '/assets/campaign-covers/hassan_apex_gt_thumb.jpg',
  '/assets/campaign-covers/kai_neon_samurai_thumb.jpg',
];

/**
 * Deterministic hash string to integer
 */
function hashString(str) {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns a stable, high-quality portrait for a creator.
 * Prioritizes bespoke confirmed portrait, explicit avatar_url,
 * then falls back gracefully to curated collection.
 */
export function getCreatorAvatar(creator) {
  if (!creator) return DEFAULT_FALLBACK_AVATAR;

  // If creator is just a string (URL or path)
  if (typeof creator === 'string') {
    const trimmed = creator.trim();
    if (trimmed.startsWith('/assets/') || trimmed.startsWith('/uploads/') || trimmed.startsWith('http')) {
      return trimmed;
    }
    const key = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (CREATOR_PROFILE_MAP[key]) return CREATOR_PROFILE_MAP[key];
    return DEFAULT_FALLBACK_AVATAR;
  }

  // 1. Check if creator matches any of the bespoke portraits by ID, handle, or name first
  const nameKey = (creator.display_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const handleKey = (creator.handle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const idKey = creator.id || '';

  // Direct Aanya Sharma / Elena Rostova mapping guarantee
  if (
    idKey === 'creator-elena-rostova' ||
    nameKey.includes('aanyasharma') ||
    handleKey === 'aanyacreative' ||
    nameKey.includes('elenarostova') ||
    handleKey === 'elenacreative'
  ) {
    return '/assets/creator-portraits/elena.jpg';
  }

  if (idKey && CREATOR_PROFILE_MAP[idKey]) return CREATOR_PROFILE_MAP[idKey];
  if (handleKey && CREATOR_PROFILE_MAP[handleKey]) return CREATOR_PROFILE_MAP[handleKey];
  if (nameKey && CREATOR_PROFILE_MAP[nameKey]) return CREATOR_PROFILE_MAP[nameKey];

  // 2. If explicit avatar_url is provided and valid, prioritize it
  const rawUrl = creator.avatar_url;
  if (rawUrl && typeof rawUrl === 'string') {
    const trimmed = rawUrl.trim();
    if (
      trimmed.startsWith('/assets/creator-portraits/') ||
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }
    const cleanFile = trimmed.replace(/^\/?(assets\/creators_profiles\/|creators_profiles\/)/, '');
    if (CREATOR_PROFILE_MAP[cleanFile]) {
      return CREATOR_PROFILE_MAP[cleanFile];
    }
    if (trimmed.startsWith('/assets/creators_profiles/') || trimmed.startsWith('/assets/avatars/')) {
      return trimmed;
    }
  }

  // 3. Deterministically assign a unique portrait from our curated collection
  const seed = creator.id || creator.handle || creator.display_name || 'kivora-creator';
  const index = hashString(seed) % CURATED_CREATOR_PORTRAITS.length;
  return CURATED_CREATOR_PORTRAITS[index];
}

/**
 * Safe image onError handler to prevent broken image displays
 */
export function handleAvatarError(e, fallback = DEFAULT_FALLBACK_AVATAR) {
  if (e && e.target) {
    e.target.onerror = null;
    e.target.src = fallback;
  }
}

export const DOMAIN_COVER_POOLS = {
  FOOD_BEVERAGE: [
    '/assets/campaign-covers/brand_beverage_cover.jpg',
    '/assets/categories/food_beverage/cold_brew_nitrogen_pour.png',
    '/assets/categories/food_beverage/artisanal_sourdough_pastry.png',
    '/assets/categories/food_beverage/cascading_cold_brew.png',
    '/assets/categories/food_beverage/heritage_pastry_craft.png',
    '/assets/categories/food_beverage/botanical_citrus_pour.png',
    '/assets/categories/food_beverage/nitrogen_brew_commercial.png',
    '/assets/categories/food_beverage/artisanal_bakery_warm.png',
    '/assets/categories/food_beverage/cold_brew_cinematic.png',
    '/assets/categories/food_beverage/refreshing_beverage_splash.png',
    '/assets/categories/food_beverage/espresso_nitrogen_draft.png',
    '/assets/categories/food_beverage/rustic_sourdough_display.png',
    '/assets/categories/food_beverage/artisan_croissant_breakfast.png',
    '/assets/categories/food_beverage/specialty_beverage_craft.png',
    '/assets/categories/food_beverage/gourmet_bakery_heritage.png',
  ],
  AUTOMOTIVE: [
    '/assets/campaign-covers/brand_automotive_cover.jpg',
    '/assets/portfolio/hassan_apex_gt_thumb.jpg',
    '/assets/briefs/AUTOMOTIVE/AUTOMOTIVE_image1.png',
    '/assets/briefs/AUTOMOTIVE/AUTOMOTIVE_image2.png',
    '/assets/briefs/AUTOMOTIVE/AUTOMOTIVE_image3.png',
  ],
  BEAUTY_SKINCARE: [
    '/assets/campaign-covers/brand_skincare_cover.jpg',
    '/assets/portfolio/sophia_cellular_dew_thumb.jpg',
    '/assets/briefs/BEAUTY_SKINCARE/BEAUTY_SKINCARE_image1.png',
    '/assets/briefs/BEAUTY_SKINCARE/BEAUTY_SKINCARE_image2.png',
    '/assets/briefs/BEAUTY_SKINCARE/BEAUTY_SKINCARE_image3.png',
  ],
  FASHION_APPAREL: [
    '/assets/campaign-covers/brand_fashion_cover.jpg',
    '/assets/portfolio/maya_liquid_organza_thumb.jpg',
    '/assets/briefs/FASHION_APPAREL/FASHION_APPAREL_image1.png',
    '/assets/briefs/FASHION_APPAREL/FASHION_APPAREL_image2.png',
  ],
  TECHNOLOGY_GADGETS: [
    '/assets/campaign-covers/brand_technology_cover.jpg',
    '/assets/briefs/TECHNOLOGY_GADGETS/TECHNOLOGY_GADGETS_image1.png',
    '/assets/briefs/TECHNOLOGY_GADGETS/TECHNOLOGY_GADGETS_image2.png',
  ],
  GAMING: [
    '/assets/campaign-covers/brand_gaming_cover.jpg',
    '/assets/portfolio/kai_neon_samurai_thumb.jpg',
    '/assets/briefs/GAMING/GAMING_image1.png',
    '/assets/briefs/GAMING/GAMING_image2.png',
  ],
  HOME_INTERIOR_DESIGN: [
    '/assets/campaign-covers/brand_architecture_cover.jpg',
    '/assets/briefs/HOME_INTERIOR_DESIGN/HOME_INTERIOR_DESIGN_image1.png',
  ],
  ARCHITECTURE_REAL_ESTATE: [
    '/assets/campaign-covers/brand_architecture_cover.jpg',
    '/assets/briefs/HOME_INTERIOR_DESIGN/HOME_INTERIOR_DESIGN_image1.png',
  ],
  CINEMATIC_VIDEO: [
    '/assets/portfolio/solaris_anomaly_thumb.jpg',
    '/assets/briefs/CINEMATIC_VIDEO/CINEMATIC_VIDEO_image1.png',
  ],
  '3D_CGI': [
    '/assets/portfolio/hassan_apex_gt_thumb.jpg',
    '/assets/briefs/3D_CGI/3D_CGI_image1.png',
    '/assets/briefs/3D_CGI/3D_CGI_image2.png',
  ],
  AI_ART: [
    '/assets/portfolio/kai_neon_samurai_thumb.jpg',
    '/assets/briefs/AI_ART/AI_ART_image1.png',
  ],
  MOTION_DESIGN: [
    '/assets/portfolio/marcus_aura_droplet_thumb.jpg',
    '/assets/briefs/MOTION_DESIGN/MOTION_DESIGN_image1.png',
  ],
  VISUAL_EFFECTS: [
    '/assets/portfolio/marcus_aura_droplet_thumb.jpg',
    '/assets/briefs/3D_CGI/3D_CGI_image3.png',
  ],
  FITNESS_SPORTS: [
    '/assets/briefs/FITNESS_SPORTS/FITNESS_SPORTS_image1.png',
  ],
  FILM_ENTERTAINMENT: [
    '/assets/portfolio/solaris_anomaly_thumb.jpg',
    '/assets/briefs/FILM_ENTERTAINMENT/FILM_ENTERTAINMENT_image1.png',
  ],
  MUSIC_AUDIO: [
    '/assets/briefs/MUSIC_AUDIO/MUSIC_AUDIO_image1.png',
  ],
  PACKAGING_INDUSTRIAL_DESIGN: [
    '/assets/campaign-covers/brand_beverage_cover.jpg',
    '/assets/briefs/PACKAGING_INDUSTRIAL_DESIGN/PACKAGING_INDUSTRIAL_DESIGN_image1.png',
  ],
  ENVIRONMENTAL_SUSTAINABILITY: [
    '/assets/campaign-covers/brand_architecture_cover.jpg',
  ],
  EXPERIMENTAL_GENERATIVE_ART: [
    '/assets/portfolio/kai_neon_samurai_thumb.jpg',
  ],
};

/**
 * Resolves the primary creative domain of a creator.
 */
export function resolveCreatorDomain(creator) {
  if (!creator) return '3D_CGI';
  const catText = Array.isArray(creator.categories)
    ? creator.categories.map((c) => (typeof c === 'string' ? c : (c.name || c.slug || ''))).join(' ')
    : '';
  const text = `${creator.primary_specialization || ''} ${catText} ${creator.bio || ''}`.toLowerCase();

  if (text.includes('food') || text.includes('beverage') || text.includes('culinary') || text.includes('coffee') || text.includes('dining')) return 'FOOD_BEVERAGE';
  if (text.includes('beauty') || text.includes('skincare') || text.includes('cosmetic')) return 'BEAUTY_SKINCARE';
  if (text.includes('automotive') || text.includes('vehicle') || text.includes('car')) return 'AUTOMOTIVE';
  if (text.includes('fashion') || text.includes('apparel') || text.includes('runway')) return 'FASHION_APPAREL';
  if (text.includes('tech') || text.includes('gadget') || text.includes('hardware')) return 'TECHNOLOGY_GADGETS';
  if (text.includes('game') || text.includes('gaming')) return 'GAMING';
  if (text.includes('interior') || text.includes('furniture') || text.includes('home')) return 'HOME_INTERIOR_DESIGN';
  if (text.includes('architecture') || text.includes('real estate')) return 'ARCHITECTURE_REAL_ESTATE';
  if (text.includes('cinematic') || text.includes('film') || text.includes('director')) return 'CINEMATIC_VIDEO';
  if (text.includes('motion') || text.includes('animation')) return 'MOTION_DESIGN';
  if (text.includes('vfx') || text.includes('effect') || text.includes('fluid')) return 'VISUAL_EFFECTS';
  if (text.includes('music') || text.includes('audio') || text.includes('sound')) return 'MUSIC_AUDIO';
  if (text.includes('fitness') || text.includes('sport')) return 'FITNESS_SPORTS';
  if (text.includes('packaging')) return 'PACKAGING_INDUSTRIAL_DESIGN';
  if (text.includes('3d') || text.includes('cgi')) return '3D_CGI';
  return 'AI_ART';
}

/**
 * Returns primary representative cover for a creator domain.
 */
export function getDomainPrimaryCover(creator) {
  const domain = resolveCreatorDomain(creator);
  const pool = DOMAIN_COVER_POOLS[domain] || DOMAIN_COVER_POOLS['3D_CGI'];
  return pool?.[0] || DEFAULT_CAMPAIGN_COVERS[0];
}

/**
 * Deterministically returns a domain-specific cover asset for a creator.
 */
export function getCreatorFallbackCover(creator) {
  const domain = resolveCreatorDomain(creator);
  const pool = DOMAIN_COVER_POOLS[domain] || DOMAIN_COVER_POOLS['3D_CGI'] || DEFAULT_CAMPAIGN_COVERS;
  const seed = (creator?.id || creator?.handle || 'kivora-creator') + '-kivora-cover-salt-7';
  const h = hashString(seed);
  return pool[h % pool.length];
}

/**
 * Returns a domain-accurate, high-aesthetic cover image for a creator profile/card.
 */
export function getCreatorCover(creator) {
  if (!creator) return DEFAULT_CAMPAIGN_COVERS[0];
  if (creator.cover_image_url && typeof creator.cover_image_url === 'string' && creator.cover_image_url.startsWith('/assets/')) {
    return creator.cover_image_url;
  }
  if (creator.featured_project_thumbnail && typeof creator.featured_project_thumbnail === 'string' && creator.featured_project_thumbnail.startsWith('/assets/')) {
    return creator.featured_project_thumbnail;
  }
  return getCreatorFallbackCover(creator);
}

// Vite asset glob to ensure all 33 bespoke brand logos are bundled and tracked by Vite
export const BRAND_LOGO_MODULES = import.meta.glob('../assets/brands/*.svg', {
  eager: true,
  import: 'default',
});

export const DEFAULT_FALLBACK_BRAND_LOGO = '/assets/brands/lumina-skincare.svg';
export const NEUTRAL_BRAND_MARK = '/assets/brands/default-brand.svg';

export const BRAND_LOGO_MAP = {
  "aerodrone-systems": "/assets/brands/aerodrone-systems.svg",
  "aerodrone-systems.svg": "/assets/brands/aerodrone-systems.svg",
  "aerodronesystems": "/assets/brands/aerodrone-systems.svg",
  "apex-interactive": "/assets/brands/apex-interactive.svg",
  "apex-interactive.svg": "/assets/brands/apex-interactive.svg",
  "apexinteractive": "/assets/brands/apex-interactive.svg",
  "atelier-kroma": "/assets/brands/atelier-kroma.svg",
  "atelier-kroma.svg": "/assets/brands/atelier-kroma.svg",
  "atelierkroma": "/assets/brands/atelier-kroma.svg",
  "aura-botanicals": "/assets/brands/aura-botanicals.svg",
  "aura-botanicals.svg": "/assets/brands/aura-botanicals.svg",
  "aurabotanicals": "/assets/brands/aura-botanicals.svg",
  "brand-apex-gaming": "/assets/brands/apex-interactive.svg",
  "brand-aurora-fashion": "/assets/brands/maison-aurora.svg",
  "brand-lumina-skincare": "/assets/brands/lumina-skincare.svg",
  "brand-synth-001": "/assets/brands/aura-botanicals.svg",
  "brand-synth-002": "/assets/brands/veloce-motors.svg",
  "brand-synth-003": "/assets/brands/neogrid-cloud.svg",
  "brand-synth-004": "/assets/brands/lumina-luxury-apparel.svg",
  "brand-synth-005": "/assets/brands/zenith-cold-brew.svg",
  "brand-synth-006": "/assets/brands/quantum-precision-chrono.svg",
  "brand-synth-007": "/assets/brands/elysium-resorts.svg",
  "brand-synth-009": "/assets/brands/solara-clean-energy.svg",
  "brand-synth-010": "/assets/brands/savor-artisanal-foods.svg",
  "brand-synth-011": "/assets/brands/hyperion-audio.svg",
  "brand-synth-012": "/assets/brands/atelier-kroma.svg",
  "brand-synth-013": "/assets/brands/verdant-health.svg",
  "brand-synth-014": "/assets/brands/nova-athletics.svg",
  "brand-synth-015": "/assets/brands/starlight-cinema.svg",
  "brand-synth-016": "/assets/brands/terra-modular-homes.svg",
  "brand-synth-017": "/assets/brands/orbital-wearables.svg",
  "brand-synth-018": "/assets/brands/kintsugi-spirits.svg",
  "brand-synth-019": "/assets/brands/prism-optics.svg",
  "brand-synth-020": "/assets/brands/catalyst-venture-lab.svg",
  "brand-synth-021": "/assets/brands/maison-du-parfum.svg",
  "brand-synth-022": "/assets/brands/aerodrone-systems.svg",
  "brand-synth-023": "/assets/brands/pulse-hydration.svg",
  "brand-synth-024": "/assets/brands/kinetix-vr-studios.svg",
  "brand-synth-025": "/assets/brands/flora-living-decor.svg",
  "brand-synth-026": "/assets/brands/chrono-logistics.svg",
  "brand-synth-027": "/assets/brands/seraphim-couture.svg",
  "brand-synth-028": "/assets/brands/omnipay-global.svg",
  "brand-vitality-labs": "/assets/brands/vitality-labs.svg",
  "brand-volt-mobility": "/assets/brands/volt-mobility.svg",
  "brand-zenith-fintech": "/assets/brands/zenith-financial.svg",
  "catalyst-venture-lab.svg": "/assets/brands/catalyst-venture-lab.svg",
  "catalyst-ventures": "/assets/brands/catalyst-venture-lab.svg",
  "catalystventurelab": "/assets/brands/catalyst-venture-lab.svg",
  "catalystventures": "/assets/brands/catalyst-venture-lab.svg",
  "chrono-logistics": "/assets/brands/chrono-logistics.svg",
  "chrono-logistics.svg": "/assets/brands/chrono-logistics.svg",
  "chronologistics": "/assets/brands/chrono-logistics.svg",
  "elysium-resorts": "/assets/brands/elysium-resorts.svg",
  "elysium-resorts.svg": "/assets/brands/elysium-resorts.svg",
  "elysiumresorts": "/assets/brands/elysium-resorts.svg",
  "flora-decor": "/assets/brands/flora-living-decor.svg",
  "flora-living-decor.svg": "/assets/brands/flora-living-decor.svg",
  "floradecor": "/assets/brands/flora-living-decor.svg",
  "floralivingdecor": "/assets/brands/flora-living-decor.svg",
  "hyperion-audio": "/assets/brands/hyperion-audio.svg",
  "hyperion-audio.svg": "/assets/brands/hyperion-audio.svg",
  "hyperionaudio": "/assets/brands/hyperion-audio.svg",
  "kinetix-vr": "/assets/brands/kinetix-vr-studios.svg",
  "kinetix-vr-studios.svg": "/assets/brands/kinetix-vr-studios.svg",
  "kinetixvr": "/assets/brands/kinetix-vr-studios.svg",
  "kinetixvrstudios": "/assets/brands/kinetix-vr-studios.svg",
  "kintsugi-spirits": "/assets/brands/kintsugi-spirits.svg",
  "kintsugi-spirits.svg": "/assets/brands/kintsugi-spirits.svg",
  "kintsugispirits": "/assets/brands/kintsugi-spirits.svg",
  "lumina-apparel": "/assets/brands/lumina-luxury-apparel.svg",
  "lumina-luxury-apparel.svg": "/assets/brands/lumina-luxury-apparel.svg",
  "lumina-skincare": "/assets/brands/lumina-skincare.svg",
  "lumina-skincare.svg": "/assets/brands/lumina-skincare.svg",
  "luminaapparel": "/assets/brands/lumina-luxury-apparel.svg",
  "luminaluxuryapparel": "/assets/brands/lumina-luxury-apparel.svg",
  "luminaskincare": "/assets/brands/lumina-skincare.svg",
  "maison-aurora": "/assets/brands/maison-aurora.svg",
  "maison-aurora.svg": "/assets/brands/maison-aurora.svg",
  "maison-du-parfum.svg": "/assets/brands/maison-du-parfum.svg",
  "maison-parfum": "/assets/brands/maison-du-parfum.svg",
  "maisonaurora": "/assets/brands/maison-aurora.svg",
  "maisonduparfum": "/assets/brands/maison-du-parfum.svg",
  "maisonparfum": "/assets/brands/maison-du-parfum.svg",
  "neogrid-cloud": "/assets/brands/neogrid-cloud.svg",
  "neogrid-cloud.svg": "/assets/brands/neogrid-cloud.svg",
  "neogridcloud": "/assets/brands/neogrid-cloud.svg",
  "nova-athletics": "/assets/brands/nova-athletics.svg",
  "nova-athletics.svg": "/assets/brands/nova-athletics.svg",
  "novaathletics": "/assets/brands/nova-athletics.svg",
  "omnipay-global": "/assets/brands/omnipay-global.svg",
  "omnipay-global.svg": "/assets/brands/omnipay-global.svg",
  "omnipayglobal": "/assets/brands/omnipay-global.svg",
  "orbital-wearables": "/assets/brands/orbital-wearables.svg",
  "orbital-wearables.svg": "/assets/brands/orbital-wearables.svg",
  "orbitalwearables": "/assets/brands/orbital-wearables.svg",
  "prism-optics": "/assets/brands/prism-optics.svg",
  "prism-optics.svg": "/assets/brands/prism-optics.svg",
  "prismoptics": "/assets/brands/prism-optics.svg",
  "pulse-hydration": "/assets/brands/pulse-hydration.svg",
  "pulse-hydration.svg": "/assets/brands/pulse-hydration.svg",
  "pulsehydration": "/assets/brands/pulse-hydration.svg",
  "quantum-chrono": "/assets/brands/quantum-precision-chrono.svg",
  "quantum-precision-chrono.svg": "/assets/brands/quantum-precision-chrono.svg",
  "quantumchrono": "/assets/brands/quantum-precision-chrono.svg",
  "quantumprecisionchrono": "/assets/brands/quantum-precision-chrono.svg",
  "savor-artisanal-foods.svg": "/assets/brands/savor-artisanal-foods.svg",
  "savor-foods": "/assets/brands/savor-artisanal-foods.svg",
  "savorartisanalfoods": "/assets/brands/savor-artisanal-foods.svg",
  "savorfoods": "/assets/brands/savor-artisanal-foods.svg",
  "seraphim-couture": "/assets/brands/seraphim-couture.svg",
  "seraphim-couture.svg": "/assets/brands/seraphim-couture.svg",
  "seraphimcouture": "/assets/brands/seraphim-couture.svg",
  "solara-clean-energy.svg": "/assets/brands/solara-clean-energy.svg",
  "solara-energy": "/assets/brands/solara-clean-energy.svg",
  "solaracleanenergy": "/assets/brands/solara-clean-energy.svg",
  "solaraenergy": "/assets/brands/solara-clean-energy.svg",
  "starlight-cinema": "/assets/brands/starlight-cinema.svg",
  "starlight-cinema.svg": "/assets/brands/starlight-cinema.svg",
  "starlightcinema": "/assets/brands/starlight-cinema.svg",
  "terra-modular": "/assets/brands/terra-modular-homes.svg",
  "terra-modular-homes.svg": "/assets/brands/terra-modular-homes.svg",
  "terramodular": "/assets/brands/terra-modular-homes.svg",
  "terramodularhomes": "/assets/brands/terra-modular-homes.svg",
  "veloce-motors": "/assets/brands/veloce-motors.svg",
  "veloce-motors.svg": "/assets/brands/veloce-motors.svg",
  "velocemotors": "/assets/brands/veloce-motors.svg",
  "verdant-health": "/assets/brands/verdant-health.svg",
  "verdant-health.svg": "/assets/brands/verdant-health.svg",
  "verdanthealth": "/assets/brands/verdant-health.svg",
  "vitality-labs": "/assets/brands/vitality-labs.svg",
  "vitality-labs.svg": "/assets/brands/vitality-labs.svg",
  "vitalitylabs": "/assets/brands/vitality-labs.svg",
  "volt-mobility": "/assets/brands/volt-mobility.svg",
  "volt-mobility.svg": "/assets/brands/volt-mobility.svg",
  "voltmobility": "/assets/brands/volt-mobility.svg",
  "zenith-beverages": "/assets/brands/zenith-cold-brew.svg",
  "zenith-cold-brew.svg": "/assets/brands/zenith-cold-brew.svg",
  "zenith-financial": "/assets/brands/zenith-financial.svg",
  "zenith-financial.svg": "/assets/brands/zenith-financial.svg",
  "zenithbeverages": "/assets/brands/zenith-cold-brew.svg",
  "zenithcoldbrew": "/assets/brands/zenith-cold-brew.svg",
  "zenithfinancial": "/assets/brands/zenith-financial.svg",
};

/**
 * Returns a deterministic brand logo asset path.
 * Resolves against explicit logo_url, brand ID, slug, normalized company name, or SVG filename.
 * Falls back to DEFAULT_FALLBACK_BRAND_LOGO.
 */
export function getBrandLogo(brand) {
  if (!brand) return DEFAULT_FALLBACK_BRAND_LOGO;

  // If brand is a string (URL, path, ID, slug, or name)
  if (typeof brand === 'string') {
    const trimmed = brand.trim();
    if (
      trimmed.startsWith('/assets/brands/') ||
      trimmed.startsWith('/assets/brand-identities/') ||
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }
    const cleanFile = trimmed.replace(/^\/?(assets\/brands\/|brands\/)/, '');
    if (BRAND_LOGO_MAP[cleanFile]) return BRAND_LOGO_MAP[cleanFile];
    const key = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (BRAND_LOGO_MAP[key]) return BRAND_LOGO_MAP[key];
    if (BRAND_LOGO_MAP[trimmed]) return BRAND_LOGO_MAP[trimmed];
    return DEFAULT_FALLBACK_BRAND_LOGO;
  }

  // 1. If explicit logo_url exists on the brand object
  const rawUrl = brand.logo_url;
  if (rawUrl && typeof rawUrl === 'string') {
    const trimmed = rawUrl.trim();
    if (
      trimmed.startsWith('/assets/brands/') ||
      trimmed.startsWith('/assets/brand-identities/') ||
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }
    const cleanFile = trimmed.replace(/^\/?(assets\/brands\/|brands\/)/, '');
    if (BRAND_LOGO_MAP[cleanFile]) return BRAND_LOGO_MAP[cleanFile];
  }

  // 2. Check by ID or slug
  if (brand.id && BRAND_LOGO_MAP[brand.id]) return BRAND_LOGO_MAP[brand.id];
  if (brand.slug && BRAND_LOGO_MAP[brand.slug]) return BRAND_LOGO_MAP[brand.slug];

  // 3. Check by normalized company name or slug
  const nameKey = (brand.company_name || brand.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (nameKey && BRAND_LOGO_MAP[nameKey]) return BRAND_LOGO_MAP[nameKey];

  const slugKey = (brand.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (slugKey && BRAND_LOGO_MAP[slugKey]) return BRAND_LOGO_MAP[slugKey];

  // 4. Fallback
  return DEFAULT_FALLBACK_BRAND_LOGO;
}

/**
 * Safe brand logo error handler
 */
export function handleBrandLogoError(e, fallback = DEFAULT_FALLBACK_BRAND_LOGO) {
  if (e && e.target) {
    e.target.onerror = null;
    e.target.src = fallback;
  }
}

// Re-export campaign brief 1-to-1 mapping and domain image resolver
export {
  getCampaignBriefImage,
  CAMPAIGN_BRIEF_IMAGE_MAP,
} from '../data/campaignBriefImageMap';

export {
  getBriefCoverImage,
  resolveBriefDomain,
  DOMAIN_FOLDERS,
  DOMAIN_LABELS,
  getDomainImages,
} from './briefImageMap';

