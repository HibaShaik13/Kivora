/**
 * Central API Client configuration for Kivora Frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('kivora_token');

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }
    return response.json();
  } catch (err) {
    // If relative fetch failed, try direct localhost:8000 fallback in dev mode
    if (!API_BASE_URL && url.startsWith('/api')) {
      const fallbackUrl = `http://localhost:8000${endpoint}`;
      const response = await fetch(fallbackUrl, config);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
      }
      return response.json();
    }
    throw err;
  }
}

export const api = {
  // --- Taxonomy ---
  getSkills: () => fetchApi('/api/taxonomy/skills'),
  getTools: () => fetchApi('/api/taxonomy/tools'),

  // --- Creators ---
  getCreators: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.specialization) query.append('specialization', params.specialization);
    if (params.style) query.append('style', params.style);
    if (params.skill) query.append('skill', params.skill);
    if (params.tool) query.append('tool', params.tool);
    if (params.content_type) query.append('content_type', params.content_type);
    if (params.aspect_ratio) query.append('aspect_ratio', params.aspect_ratio);
    if (params.min_budget) query.append('min_budget', params.min_budget);
    if (params.max_budget) query.append('max_budget', params.max_budget);
    if (params.min_rating) query.append('min_rating', params.min_rating);
    if (params.availability) query.append('availability', params.availability);
    if (params.verification_tier) query.append('verification_tier', params.verification_tier);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.limit) query.append('limit', params.limit);
    if (params.page) query.append('page', params.page);

    const qs = query.toString();
    return fetchApi(`/api/creators${qs ? `?${qs}` : ''}`);
  },

  getCreator: (idOrHandle) => fetchApi(`/api/creators/${idOrHandle}`),
  getMyCreatorProfile: () => fetchApi('/api/creators/me'),
  setupOrUpdateCreatorProfile: (payload) =>
    fetchApi('/api/creators/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCreatorProfile: (payload) =>
    fetchApi('/api/creators/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // --- Creator Portfolio ---
  addPortfolioProject: (payload) =>
    fetchApi('/api/creators/portfolio', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPortfolioProject: (idOrSlug) => fetchApi(`/api/creators/portfolio/${idOrSlug}`),
  updatePortfolioProject: (projectId, payload) =>
    fetchApi(`/api/creators/portfolio/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deletePortfolioProject: (projectId) =>
    fetchApi(`/api/creators/portfolio/${projectId}`, {
      method: 'DELETE',
    }),
  addProjectEvidence: (projectId, payload) =>
    fetchApi(`/api/creators/portfolio/${projectId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addProjectWorkflowStep: (projectId, payload) =>
    fetchApi(`/api/creators/portfolio/${projectId}/workflow-step`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Brands ---
  getBrands: () => fetchApi('/api/brands'),
  getMyBrandProfile: () => fetchApi('/api/brands/me'),
  getBrand: (idOrSlug) => fetchApi(`/api/brands/${idOrSlug}`),
  setupBrandProfile: (payload) =>
    fetchApi('/api/brands/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBrandProfile: (payload) =>
    fetchApi('/api/brands/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // --- Briefs ---
  getBriefs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.content_type) query.append('content_type', params.content_type);
    if (params.aspect_ratio) query.append('aspect_ratio', params.aspect_ratio);
    if (params.min_budget) query.append('min_budget', params.min_budget);
    if (params.max_budget) query.append('max_budget', params.max_budget);
    if (params.status) query.append('status', params.status);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.limit) query.append('limit', params.limit);
    if (params.page) query.append('page', params.page);

    const qs = query.toString();
    return fetchApi(`/api/briefs${qs ? `?${qs}` : ''}`);
  },

  getBrief: (idOrSlug) => fetchApi(`/api/briefs/${idOrSlug}`),
  createBrief: (payload) =>
    fetchApi('/api/briefs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBrief: (id, payload) =>
    fetchApi(`/api/briefs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateBriefStatus: (id, status) =>
    fetchApi(`/api/briefs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteBrief: (id) =>
    fetchApi(`/api/briefs/${id}`, {
      method: 'DELETE',
    }),

  // --- Applications ---
  applyToBrief: (briefId, payload) =>
    fetchApi(`/api/briefs/${briefId}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyApplications: () => fetchApi('/api/briefs/applications/my-applications'),
  getBriefApplications: (briefId) => fetchApi(`/api/briefs/${briefId}/applications`),
  updateApplicationStatus: (applicationId, payload) =>
    fetchApi(`/api/briefs/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // --- Engagements & Collaborations ---
  getEngagements: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchApi(`/api/engagements${qs}`);
  },
  getEngagement: (id) => fetchApi(`/api/engagements/${id}`),
  submitDeliverable: (engagementId, payload) =>
    fetchApi(`/api/engagements/${engagementId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  requestRevisions: (engagementId, payload) =>
    fetchApi(`/api/engagements/${engagementId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveDeliverable: (engagementId) =>
    fetchApi(`/api/engagements/${engagementId}/approve`, {
      method: 'POST',
    }),
  reviewEngagement: (engagementId, payload) =>
    fetchApi(`/api/engagements/${engagementId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEngagementStatus: (engagementId, status) =>
    fetchApi(`/api/engagements/${engagementId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // --- Verification ---
  submitVerificationRequest: (payload) =>
    fetchApi('/api/verification/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyVerificationRequests: () => fetchApi('/api/verification/my-requests'),
  getAdminVerificationRequests: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchApi(`/api/verification/requests${qs}`);
  },
  reviewVerificationRequest: (id, payload) =>
    fetchApi(`/api/verification/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  analyzeVerificationAi: (id) =>
    fetchApi(`/api/verification/requests/${id}/analyze`, {
      method: 'POST',
    }),
  getVerificationAiAnalysis: (id) => fetchApi(`/api/verification/requests/${id}/ai-analysis`),

  // --- Matching ---
  getMatchesForBrief: (briefId, params = {}) => {
    const query = new URLSearchParams();
    if (params.min_score !== undefined) query.append('min_score', params.min_score);
    if (params.enforce_hard_filters !== undefined) query.append('enforce_hard_filters', params.enforce_hard_filters);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return fetchApi(`/api/match/briefs/${briefId}${qs ? `?${qs}` : ''}`);
  },

  // --- AI Services ---
  generateAiBrief: (payload) =>
    fetchApi('/api/ai/generate-brief', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Media Upload ---
  uploadMedia: async (file, category = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return fetchApi('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

export default api;
