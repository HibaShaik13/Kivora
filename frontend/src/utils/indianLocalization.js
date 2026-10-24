/**
 * indianLocalization.js
 * 
 * Kivora Indian Market Localization & INR Currency Engine
 * Provides deterministic, culturally authentic Indian names, locations,
 * AI portraits, and INR pricing bounds (₹10,000 to ₹49,999).
 * 
 * Strict Guarantees:
 * - Preserves all genuine users (e.g. Shaik Arfa Anjum, Pavani, Sadik) without modification.
 * - Does not alter database records or backend API contracts.
 * - Safe presentation layer overlay for fictional demo creators.
 */

export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Formats numeric values to consistent INR currency:
 * Examples: ₹10,000, ₹18,500, ₹25,000, ₹35,000, ₹49,999
 */
export function formatINR(val) {
  if (val === undefined || val === null || val === '') {
    return '₹0';
  }
  const num = Number(val);
  if (isNaN(num)) return '₹0';
  return inrFormatter.format(Math.round(num));
}

/**
 * Demo budget and pricing clamp:
 * Strictly enforces minimum ₹10,000 and maximum ₹49,999 (never exceeds ₹50,000).
 */
export function clampDemoBudget(val, fallback = 25000) {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return fallback;
  if (num < 10000) {
    // If it's a USD-scale seed amount like 800, 1500, 2500, 4000
    // map it into the requested ₹10,000 - ₹49,999 range realistically
    const mapped = Math.round(10000 + (num % 39999));
    return Math.min(49999, Math.max(10000, mapped));
  }
  if (num > 49999) {
    return 49000;
  }
  return Math.round(num);
}

// Valid Indian city & state combinations as specified
export const INDIAN_LOCATIONS = [
  'Bengaluru, Karnataka',
  'Mumbai, Maharashtra',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Chennai, Tamil Nadu',
  'New Delhi, Delhi',
  'Kochi, Kerala',
  'Jaipur, Rajasthan',
  'Ahmedabad, Gujarat',
  'Kolkata, West Bengal',
  'Visakhapatnam, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Lucknow, Uttar Pradesh',
  'Indore, Madhya Pradesh',
  'Bhubaneswar, Odisha',
  'Guwahati, Assam',
  'Chandigarh, Punjab',
  'Coimbatore, Tamil Nadu',
  'Surat, Gujarat',
  'Bhopal, Madhya Pradesh',
];

// 14 Core Fictional Demo Personas with bespoke portraits & valid Indian locations
export const CORE_DEMO_CREATORS = {
  'creator-elena-rostova': {
    display_name: 'Aanya Sharma',
    handle: 'aanya_creative',
    location: 'Bengaluru, Karnataka',
    avatar_url: '/assets/creator-portraits/elena.jpg',
    min_budget: 38000,
    hourly_rate: 1800,
    bio: 'Pioneering generative cinematic video direction, luxury commercial visuals, and sci-fi aesthetic world-building.',
  },
  'creator-marcus-vance': {
    display_name: 'Arjun Mehta',
    handle: 'mehta_3d',
    location: 'Mumbai, Maharashtra',
    avatar_url: '/assets/creator-portraits/marcus.jpg',
    min_budget: 28000,
    hourly_rate: 1500,
    bio: 'Photorealistic commercial product visualization, luxury cosmetics optics, and studio 3D asset staging.',
  },
  'creator-kai-tanaka': {
    display_name: 'Kabir Nair',
    handle: 'kabir_visuals',
    location: 'Kochi, Kerala',
    avatar_url: '/assets/creator-portraits/kai.jpg',
    min_budget: 22000,
    hourly_rate: 1200,
    bio: 'Specialist in 2.5D anime kinetic animation, cyber character design, and motion interpolation.',
  },
  'creator-maya-lin': {
    display_name: 'Meera Krishnan',
    handle: 'meera_fashion',
    location: 'Chennai, Tamil Nadu',
    avatar_url: '/assets/creator-portraits/maya.jpg',
    min_budget: 42000,
    hourly_rate: 2200,
    bio: 'Haute couture virtual runway campaigns, liquid textile physics, and experimental fashion storytelling.',
  },
  'creator-alex-rivera': {
    display_name: 'Aditya Verma',
    handle: 'averma_motion',
    location: 'New Delhi, Delhi',
    avatar_url: '/assets/creator-portraits/alex.jpg',
    min_budget: 32000,
    hourly_rate: 1600,
    bio: 'Commercial motion design, trajectory lighting, and brand identity animation for forward-thinking enterprises.',
  },
  'creator-zara-chen': {
    display_name: 'Zoya Qureshi',
    handle: 'zoya_concept',
    location: 'Hyderabad, Telangana',
    avatar_url: '/assets/creator-portraits/zara.jpg',
    min_budget: 18500,
    hourly_rate: 1100,
    bio: 'Concept art, fantasy environment design, and atmospheric digital matte painting for gaming and commercial media.',
  },
  'creator-devon-ross': {
    display_name: 'Dhruv Kapoor',
    handle: 'dhruv_sound_vis',
    location: 'Pune, Maharashtra',
    avatar_url: '/assets/creator-portraits/devon.jpg',
    min_budget: 24000,
    hourly_rate: 1350,
    bio: 'Audiovisual storytelling, sonic branding, and reactive visual synthesis for global brand campaigns.',
  },
  'creator-sophia-dubois': {
    display_name: 'Sanya Malhotra',
    handle: 'sanya_beauty',
    location: 'Jaipur, Rajasthan',
    avatar_url: '/assets/creator-portraits/sophia.jpg',
    min_budget: 36000,
    hourly_rate: 1900,
    bio: 'Luxury skincare commercial direction, macro droplet caustics, and cinematic beauty editorial filmmaking.',
  },
  'creator-tariq-mansoor': {
    display_name: 'Tariq Farooqi',
    handle: 'tariq_archviz',
    location: 'Lucknow, Uttar Pradesh',
    avatar_url: '/assets/creator-portraits/tariq.jpg',
    min_budget: 29000,
    hourly_rate: 1450,
    bio: 'High-end architectural visualization, spatial CGI environments, and real-time residential staging.',
  },
  'creator-chloe-dupont': {
    display_name: 'Charvi Reddy',
    handle: 'charvi_vfx',
    location: 'Visakhapatnam, Andhra Pradesh',
    avatar_url: '/assets/creator-portraits/chloe.jpg',
    min_budget: 34000,
    hourly_rate: 1700,
    bio: 'Fluid simulation VFX, particle physics visual effects, and cinematic macro commercial direction.',
  },
  'creator-liam-obrien': {
    display_name: 'Lakshya Patel',
    handle: 'lakshya_games',
    location: 'Ahmedabad, Gujarat',
    avatar_url: '/assets/creator-portraits/liam.jpg',
    min_budget: 35000,
    hourly_rate: 1750,
    bio: 'Game asset generation, Unreal Engine real-time cinematics, and interactive entertainment world design.',
  },
  'creator-ananya-sharma': {
    display_name: 'Ananya Sharma',
    handle: 'ananya_social',
    location: 'Bengaluru, Karnataka',
    avatar_url: '/assets/creator-portraits/ananya.jpg',
    min_budget: 19500,
    hourly_rate: 1150,
    bio: 'Social-first generative storytelling, viral brand campaigns, and AI creator consulting.',
  },
  'creator-hassan-khalil': {
    display_name: 'Hassan Siddiqui',
    handle: 'hassan_automotive',
    location: 'Indore, Madhya Pradesh',
    avatar_url: '/assets/creator-portraits/hassan.jpg',
    min_budget: 45000,
    hourly_rate: 2400,
    bio: 'Commercial automotive CGI, hypercar vehicle dynamics, and volumetric highway motion cinematography.',
  },
  'creator-nora-lindqvist': {
    display_name: 'Niharika Joshi',
    handle: 'niharika_design',
    location: 'Pune, Maharashtra',
    avatar_url: '/assets/creator-portraits/nora.jpg',
    min_budget: 21000,
    hourly_rate: 1250,
    bio: 'Minimalist sustainable brand design, editorial typography systems, and elegant packaging CGI.',
  },
};

// Synthetic Demo Creators Deterministic Names & Locations Mapping
const INDIAN_FIRST_NAMES_FEMALE = [
  'Aanya', 'Priya', 'Riya', 'Ananya', 'Diya', 'Sneha', 'Tanvi', 'Kavya', 'Pooja', 'Meera',
  'Shreya', 'Neha', 'Ishita', 'Divya', 'Aditi', 'Charvi', 'Niharika', 'Zoya', 'Tara', 'Sanya',
  'Swati', 'Lavanya', 'Nandini', 'Anika', 'Bhavna', 'Ritika', 'Malini', 'Trisha', 'Alisha', 'Radhika',
];

const INDIAN_FIRST_NAMES_MALE = [
  'Arjun', 'Rohan', 'Kabir', 'Aditya', 'Aryan', 'Lakshya', 'Ishan', 'Dhruv', 'Siddharth', 'Varun',
  'Kunal', 'Alok', 'Nikhil', 'Pranav', 'Dev', 'Aniket', 'Vihaan', 'Harsh', 'Tariq', 'Hassan',
  'Sameer', 'Rahul', 'Vikram', 'Ayush', 'Kartik', 'Gaurav', 'Manav', 'Yash', 'Aman', 'Samar',
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Mehta', 'Patel', 'Rao', 'Reddy', 'Nair', 'Iyer', 'Deshmukh', 'Kapoor',
  'Malhotra', 'Mukherjee', 'Sen', 'Roy', 'Banerjee', 'Joshi', 'Bhat', 'Kulkarni', 'Pillai', 'Menon',
  'Choudhury', 'Das', 'Nambiar', 'Saxena', 'Agarwal', 'Gupta', 'Farooqi', 'Siddiqui', 'Qureshi', 'Mishra',
];

/**
 * Checks whether an account belongs to a genuine user who must retain their details completely intact.
 */
export function isGenuineUser(creator) {
  if (!creator) return false;
  const id = String(creator.id || '');
  const handle = String(creator.handle || '').toLowerCase();
  const name = String(creator.display_name || creator.name || '').toLowerCase();
  const email = String(creator.email || '').toLowerCase();

  // 1. Shaik Arfa Anjum (active workspace owner & genuine registered user)
  if (id === 'creator-4398746489' || handle === 'arfa' || name.includes('shaik') || name.includes('arfa')) {
    return true;
  }
  // 2. Pavani
  if (id === 'cr-b6771ed9cf01' || id === 'cr-6775472d41e9' || handle.startsWith('pavani') || name.includes('pavani')) {
    return true;
  }
  // 3. Sadik
  if (id === 'cr-bb0c884763ba' || handle.startsWith('sadik') || name.includes('sadik')) {
    return true;
  }
  // 4. Test accounts created during automated verification or test runs
  if (
    handle.startsWith('test_') ||
    name.startsWith('test_') ||
    name.startsWith('test user') ||
    name.includes('audit') ||
    name.includes('google test') ||
    name.includes('octocat')
  ) {
    return true;
  }
  // 5. Any user with a real email domain that is not a fictional .demo domain
  if (email && !email.endsWith('@kivora.demo') && !email.includes('synth')) {
    return true;
  }
  return false;
}

/**
 * Generates deterministic Indian localization for a synthetic demo creator (cr-synth-xxx).
 */
function getSyntheticLocalization(id) {
  const match = id.match(/cr-synth-(\d+)/);
  const index = match ? parseInt(match[1], 10) : Math.abs(id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  
  const isFemale = index % 2 === 0;
  const firstName = isFemale
    ? INDIAN_FIRST_NAMES_FEMALE[index % INDIAN_FIRST_NAMES_FEMALE.length]
    : INDIAN_FIRST_NAMES_MALE[index % INDIAN_FIRST_NAMES_MALE.length];
  const lastName = INDIAN_LAST_NAMES[index % INDIAN_LAST_NAMES.length];
  const location = INDIAN_LOCATIONS[index % INDIAN_LOCATIONS.length];
  
  // Deterministic realistic budget between ₹12,000 and ₹48,000 (never exceeds ₹50,000)
  const minBudget = 12000 + ((index * 1357) % 36000);
  const hourlyRate = Math.round(minBudget / 20);

  return {
    display_name: `${firstName} ${lastName}`,
    handle: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${String(index).padStart(2, '0')}`,
    location,
    min_budget: minBudget,
    hourly_rate: hourlyRate,
  };
}

/**
 * Safely localizes a creator profile for the Indian market.
 * Genuine users are preserved 100% as-is.
 * Fictional demo creators receive natural Indian names, matched Indian locations, and INR bounds.
 */
export function localizeCreator(creator) {
  if (!creator) return creator;
  if (isGenuineUser(creator)) {
    return creator;
  }

  const id = creator.id || '';
  const userId = creator.user_id || '';
  const handle = creator.handle || '';

  // 1. Core demo creators (matching by id, user_id, or known demo handle)
  if (CORE_DEMO_CREATORS[id]) {
    const override = CORE_DEMO_CREATORS[id];
    return {
      ...creator,
      display_name: override.display_name,
      handle: override.handle,
      location: override.location,
      avatar_url: override.avatar_url || creator.avatar_url,
      min_budget: override.min_budget,
      hourly_rate: override.hourly_rate,
      bio: override.bio || creator.bio,
    };
  }

  // Primary creator account (user-creator-1 / elena_creative)
  if (id === 'creator-elena-rostova' || userId === 'user-creator-1' || handle === 'elena_creative') {
    const override = CORE_DEMO_CREATORS['creator-elena-rostova'];
    return {
      ...creator,
      display_name: override.display_name,
      handle: override.handle,
      location: override.location,
      avatar_url: override.avatar_url || creator.avatar_url,
      min_budget: override.min_budget,
      hourly_rate: override.hourly_rate,
      bio: override.bio || creator.bio,
    };
  }

  // 2. By original foreign name match (for fallback or nested views)
  for (const [demoId, override] of Object.entries(CORE_DEMO_CREATORS)) {
    const rawDemoName = demoId.replace('creator-', '').replace('-', ' ');
    if (
      creator.display_name &&
      creator.display_name.toLowerCase().replace(/[^a-z]/g, '') === rawDemoName.replace(/[^a-z]/g, '')
    ) {
      return {
        ...creator,
        display_name: override.display_name,
        handle: override.handle,
        location: override.location,
        avatar_url: override.avatar_url || creator.avatar_url,
        min_budget: override.min_budget,
        hourly_rate: override.hourly_rate,
        bio: override.bio || creator.bio,
      };
    }
  }

  // 3. Synthetic demo creators (cr-synth-*)
  if (typeof id === 'string' && id.startsWith('cr-synth-')) {
    const synth = getSyntheticLocalization(id);
    return {
      ...creator,
      display_name: synth.display_name,
      handle: synth.handle,
      location: synth.location,
      min_budget: synth.min_budget,
      hourly_rate: synth.hourly_rate,
    };
  }

  // 4. Any other fictional demo creator with foreign location
  if (creator.location && !creator.location.includes('India') && !isGenuineUser(creator)) {
    // Pick deterministic Indian location from list based on id or handle
    const hash = Math.abs((id || creator.handle || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
    return {
      ...creator,
      location: INDIAN_LOCATIONS[hash % INDIAN_LOCATIONS.length],
      min_budget: clampDemoBudget(creator.min_budget),
    };
  }

  // Ensure any demo budget stays clamped
  return {
    ...creator,
    min_budget: clampDemoBudget(creator.min_budget),
  };
}

/**
 * Localizes an array of creators safely.
 */
export function localizeCreators(creators) {
  if (!creators) return creators;
  if (Array.isArray(creators)) return creators.map(localizeCreator);
  if (creators && Array.isArray(creators.items)) {
    return { ...creators, items: creators.items.map(localizeCreator) };
  }
  return creators;
}

/**
 * Localizes message sender information in conversation history.
 */
export function localizeMessage(msg) {
  if (!msg) return msg;
  const updated = { ...msg };
  const senderId = updated.sender_id || '';
  const senderName = updated.sender_name || '';

  if (
    senderId === 'user-creator-1' ||
    senderName.toLowerCase().includes('elena') ||
    (updated.sender_role === 'CREATOR' && senderName.toLowerCase().includes('rostova'))
  ) {
    updated.sender_name = 'Aanya Sharma';
  } else {
    for (const [demoId, override] of Object.entries(CORE_DEMO_CREATORS)) {
      const rawName = demoId.replace('creator-', '').replace('-', ' ');
      if (senderName.toLowerCase().replace(/[^a-z]/g, '') === rawName.replace(/[^a-z]/g, '')) {
        updated.sender_name = override.display_name;
        break;
      }
    }
  }
  return updated;
}

/**
 * Localizes message arrays or paginated results.
 */
export function localizeMessages(msgs) {
  if (!msgs) return msgs;
  if (Array.isArray(msgs)) return msgs.map(localizeMessage);
  if (msgs && Array.isArray(msgs.items)) {
    return { ...msgs, items: msgs.items.map(localizeMessage) };
  }
  return msgs;
}

/**
 * Localizes a single conversation object for messaging views.
 */
export function localizeConversation(conv) {
  if (!conv) return conv;
  const creatorId = conv.creator_id || '';
  const rawCreatorName = conv.creator_name || '';

  let localized = null;
  if (CORE_DEMO_CREATORS[creatorId]) {
    localized = CORE_DEMO_CREATORS[creatorId];
  } else if (rawCreatorName) {
    for (const [demoId, override] of Object.entries(CORE_DEMO_CREATORS)) {
      const rawName = demoId.replace('creator-', '').replace('-', ' ');
      if (rawCreatorName.toLowerCase().replace(/[^a-z]/g, '') === rawName.replace(/[^a-z]/g, '')) {
        localized = override;
        break;
      }
    }
  }

  const updated = { ...conv };

  if (localized) {
    updated.creator_name = localized.display_name;
    updated.creator_handle = localized.handle || conv.creator_handle;
    updated.creator_avatar = localized.avatar_url || conv.creator_avatar;
  } else if (typeof creatorId === 'string' && creatorId.startsWith('cr-synth-')) {
    const synth = getSyntheticLocalization(creatorId);
    updated.creator_name = synth.display_name;
    updated.creator_handle = synth.handle;
  }

  if (updated.last_message) {
    updated.last_message = localizeMessage(updated.last_message);
  }

  return updated;
}

/**
 * Localizes an array of conversations.
 */
export function localizeConversations(convs) {
  if (!convs) return convs;
  if (Array.isArray(convs)) return convs.map(localizeConversation);
  if (convs && Array.isArray(convs.items)) {
    return { ...convs, items: convs.items.map(localizeConversation) };
  }
  return convs;
}

/**
 * Localizes an application record.
 */
export function localizeApplication(app) {
  if (!app) return app;
  const creatorId = app.creator_id || '';
  const rawCreatorName = app.creator_display_name || app.creator_name || '';

  let localized = null;
  if (CORE_DEMO_CREATORS[creatorId]) {
    localized = CORE_DEMO_CREATORS[creatorId];
  } else if (rawCreatorName) {
    for (const [demoId, override] of Object.entries(CORE_DEMO_CREATORS)) {
      const rawName = demoId.replace('creator-', '').replace('-', ' ');
      if (rawCreatorName.toLowerCase().replace(/[^a-z]/g, '') === rawName.replace(/[^a-z]/g, '')) {
        localized = override;
        break;
      }
    }
  }

  const updated = { ...app };
  if (localized) {
    updated.creator_display_name = localized.display_name;
    updated.creator_name = localized.display_name;
    updated.creator_handle = localized.handle || app.creator_handle;
    updated.creator_avatar_url = localized.avatar_url || app.creator_avatar_url;
    updated.creator_avatar = localized.avatar_url || app.creator_avatar;
  } else if (typeof creatorId === 'string' && creatorId.startsWith('cr-synth-')) {
    const synth = getSyntheticLocalization(creatorId);
    updated.creator_display_name = synth.display_name;
    updated.creator_name = synth.display_name;
    updated.creator_handle = synth.handle;
  }

  if (updated.creator) {
    updated.creator = localizeCreator(updated.creator);
  }

  return updated;
}

/**
 * Localizes arrays of applications.
 */
export function localizeApplications(apps) {
  if (!apps) return apps;
  if (Array.isArray(apps)) return apps.map(localizeApplication);
  if (apps && Array.isArray(apps.items)) {
    return { ...apps, items: apps.items.map(localizeApplication) };
  }
  return apps;
}

/**
 * Localizes an engagement or project record.
 */
export function localizeEngagement(eng) {
  if (!eng) return eng;
  const creatorId = eng.creator_id || '';
  const rawCreatorName = eng.creator_display_name || eng.creator_name || '';

  let localized = null;
  if (CORE_DEMO_CREATORS[creatorId]) {
    localized = CORE_DEMO_CREATORS[creatorId];
  } else if (rawCreatorName) {
    for (const [demoId, override] of Object.entries(CORE_DEMO_CREATORS)) {
      const rawName = demoId.replace('creator-', '').replace('-', ' ');
      if (rawCreatorName.toLowerCase().replace(/[^a-z]/g, '') === rawName.replace(/[^a-z]/g, '')) {
        localized = override;
        break;
      }
    }
  }

  const updated = { ...eng };
  if (localized) {
    updated.creator_display_name = localized.display_name;
    updated.creator_name = localized.display_name;
    updated.creator_handle = localized.handle || eng.creator_handle;
    updated.creator_avatar_url = localized.avatar_url || eng.creator_avatar_url;
    updated.creator_avatar = localized.avatar_url || eng.creator_avatar;
  } else if (typeof creatorId === 'string' && creatorId.startsWith('cr-synth-')) {
    const synth = getSyntheticLocalization(creatorId);
    updated.creator_display_name = synth.display_name;
    updated.creator_name = synth.display_name;
    updated.creator_handle = synth.handle;
  }

  if (updated.creator) {
    updated.creator = localizeCreator(updated.creator);
  }

  return updated;
}

/**
 * Localizes arrays of engagements.
 */
export function localizeEngagements(engs) {
  if (!engs) return engs;
  if (Array.isArray(engs)) return engs.map(localizeEngagement);
  if (engs && Array.isArray(engs.items)) {
    return { ...engs, items: engs.items.map(localizeEngagement) };
  }
  return engs;
}

/**
 * Localizes collaboration workspace context.
 */
export function localizeWorkspace(ws) {
  if (!ws) return ws;
  const updated = { ...ws };
  if (updated.creator) {
    updated.creator = localizeCreator(updated.creator);
  }
  if (updated.engagement) {
    updated.engagement = localizeEngagement(updated.engagement);
  }
  return updated;
}
