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
      let message = errorBody.detail || `HTTP Error ${response.status}: ${response.statusText}`;
      if (Array.isArray(message)) {
        message = message.map((m) => m.msg || m.message || JSON.stringify(m)).join(', ');
      } else if (typeof message === 'object') {
        message = JSON.stringify(message);
      }
      throw new Error(message);
    }
    return response.json();
  } catch (err) {
    // If relative fetch failed, try direct localhost:8000 fallback in dev mode
    if (!API_BASE_URL && url.startsWith('/api')) {
      try {
        const fallbackUrl = `http://localhost:8000${endpoint}`;
        const response = await fetch(fallbackUrl, config);
        if (response.ok) {
          return response.json();
        }
      } catch {
        // Localhost:8000 unavailable, try deployed backend fallback
      }

      try {
        const prodFallbackUrl = `https://kivora-api-jffe.onrender.com${endpoint}`;
        const prodResponse = await fetch(prodFallbackUrl, config);
        if (prodResponse.ok) {
          return prodResponse.json();
        }
      } catch {
        // Both local and fallback failed
      }
    }
    throw err;
  }
}

export const api = {
  // --- Taxonomy ---
  getCategories: () => fetchApi('/api/taxonomy/categories'),
  getCategory: (slugOrId) => fetchApi(`/api/taxonomy/categories/${slugOrId}`),
  getSkills: () => fetchApi('/api/taxonomy/skills'),
  getTools: () => fetchApi('/api/taxonomy/tools'),

  // --- Creators ---
  getCreators: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.subcategory) query.append('subcategory', params.subcategory);
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
  getCollaboratingBrands: () => fetchApi('/api/creators/me/brands'),
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
  getHiredCreators: () => fetchApi('/api/brands/me/creators'),
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
    if (params.category) query.append('category', params.category);
    if (params.subcategory) query.append('subcategory', params.subcategory);
    if (params.skill) query.append('skill', params.skill);
    if (params.tool) query.append('tool', params.tool);
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

  getMyBriefs: () => fetchApi('/api/briefs/my-briefs'),
  getBrief: (idOrSlug) => fetchApi(`/api/briefs/${idOrSlug}`),
  createBrief: (payload) =>
    fetchApi('/api/briefs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkDuplicateBrief: (payload) =>
    fetchApi('/api/briefs/check-duplicate', {
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

  // --- Active Projects & Collaborations ---
  getProjects: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchApi(`/api/projects${qs}`);
  },
  getProject: (id) => fetchApi(`/api/projects/${id}`),
  submitProjectDeliverable: (projectId, payload) =>
    fetchApi(`/api/projects/${projectId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  requestProjectRevisions: (projectId, payload) =>
    fetchApi(`/api/projects/${projectId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveProjectDeliverable: (projectId) =>
    fetchApi(`/api/projects/${projectId}/approve`, {
      method: 'POST',
    }),
  reviewProject: (projectId, payload) =>
    fetchApi(`/api/projects/${projectId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProjectStatus: (projectId, payload) =>
    fetchApi(`/api/projects/${projectId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(typeof payload === 'string' ? { status: payload } : payload),
    }),

  // --- Engagements & Collaborations (Legacy & Direct) ---
  getEngagements: (filter) => {
    if (typeof filter === 'string') {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : '';
      return fetchApi(`/api/engagements${qs}`);
    }
    const query = new URLSearchParams();
    if (filter?.status) query.append('status', filter.status);
    if (filter?.brief_id) query.append('brief_id', filter.brief_id);
    if (filter?.creator_id) query.append('creator_id', filter.creator_id);
    const qs = query.toString();
    return fetchApi(`/api/engagements${qs ? `?${qs}` : ''}`);
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
  assistPitch: (briefId, payload = {}) =>
    fetchApi(`/api/match/briefs/${briefId}/assist-pitch`, {
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

  // ==========================================
  // PHASE 2: NOTIFICATIONS
  // ==========================================
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    if (params.unread_only) query.append('unread_only', 'true');
    const qs = query.toString();
    return fetchApi(`/api/notifications${qs ? `?${qs}` : ''}`);
  },
  getUnreadNotificationsCount: () => fetchApi('/api/notifications/unread-count'),
  markNotificationRead: (id) =>
    fetchApi(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    fetchApi('/api/notifications/read-all', {
      method: 'PATCH',
    }),
  deleteNotification: (id) =>
    fetchApi(`/api/notifications/${id}`, {
      method: 'DELETE',
    }),

  // ==========================================
  // PHASE 2: CREATOR INVITATIONS
  // ==========================================
  inviteCreator: (payload) =>
    fetchApi('/api/engagements/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyInvitations: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return fetchApi(`/api/engagements/my-invitations${qs ? `?${qs}` : ''}`);
  },
  getMyInvitationsCount: () => fetchApi('/api/engagements/my-invitations/count'),
  getBriefInvitations: (briefId) => fetchApi(`/api/engagements/brief-invitations/${briefId}`),
  acceptInvitation: (invitationId) =>
    fetchApi(`/api/engagements/invitations/${invitationId}/accept`, {
      method: 'POST',
    }),
  declineInvitation: (invitationId, reason) =>
    fetchApi(`/api/engagements/invitations/${invitationId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // ==========================================
  // PHASE 2: IN-APP MESSAGING
  // ==========================================
  getConversations: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const qs = query.toString();
    return fetchApi(`/api/messages/conversations${qs ? `?${qs}` : ''}`);
  },
  getConversationMessages: (conversationId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const qs = query.toString();
    return fetchApi(`/api/messages/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
  },
  sendMessage: (conversationId, content) =>
    fetchApi(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  markConversationRead: (conversationId) =>
    fetchApi(`/api/messages/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }),
  getConversation: (conversationId) =>
    fetchApi(`/api/messages/conversations/${conversationId}`),
  getContextualConversation: (params = {}) => {
    const query = new URLSearchParams();
    if (params.creator_id) query.append('creator_id', params.creator_id);
    if (params.brief_id) query.append('brief_id', params.brief_id);
    if (params.brand_id) query.append('brand_id', params.brand_id);
    const qs = query.toString();
    return fetchApi(`/api/messages/contextual-conversation${qs ? `?${qs}` : ''}`);
  },
  getUnreadMessagesCount: () => fetchApi('/api/messages/unread-count'),
  startEngagementConversation: (engagementId) =>
    fetchApi(`/api/messages/start-engagement-conversation/${engagementId}`, {
      method: 'POST',
    }),

  // ==========================================
  // PHASE 2: SAVED ITEMS (BOOKMARKS)
  // ==========================================
  saveBrief: (briefId) =>
    fetchApi(`/api/saved/briefs/${briefId}`, {
      method: 'POST',
    }),
  unsaveBrief: (briefId) =>
    fetchApi(`/api/saved/briefs/${briefId}`, {
      method: 'DELETE',
    }),
  getBriefSavedStatus: (briefId) => fetchApi(`/api/saved/briefs/${briefId}/status`),
  getSavedBriefs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const qs = query.toString();
    return fetchApi(`/api/saved/briefs${qs ? `?${qs}` : ''}`);
  },
  saveCreator: (creatorId) =>
    fetchApi(`/api/saved/creators/${creatorId}`, {
      method: 'POST',
    }),
  unsaveCreator: (creatorId) =>
    fetchApi(`/api/saved/creators/${creatorId}`, {
      method: 'DELETE',
    }),
  getCreatorSavedStatus: (creatorId) => fetchApi(`/api/saved/creators/${creatorId}/status`),
  getSavedCreators: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    const qs = query.toString();
    return fetchApi(`/api/saved/creators${qs ? `?${qs}` : ''}`);
  },

  // ==========================================
  // PHASE 2: SMART OPPORTUNITY ALERTS
  // ==========================================
  getAlertPreferences: () => fetchApi('/api/alerts/preferences'),
  updateAlertPreferences: (payload) =>
    fetchApi('/api/alerts/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getOpportunityAlerts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    if (params.unviewed_only) query.append('unviewed_only', 'true');
    const qs = query.toString();
    return fetchApi(`/api/alerts/opportunities${qs ? `?${qs}` : ''}`);
  },
  refreshOpportunityAlerts: (threshold = 60.0) =>
    fetchApi(`/api/alerts/refresh?threshold_score=${threshold}`, {
      method: 'POST',
    }),
  markOpportunityViewed: (alertId) =>
    fetchApi(`/api/alerts/opportunities/${alertId}/view`, {
      method: 'PATCH',
    }),

  // ==========================================
  // PHASE 3: COLLABORATION WORKSPACE, MILESTONES & REVIEWS
  // ==========================================
  getWorkspace: (engagementId) => fetchApi(`/api/workspaces/${engagementId}`),
  getWorkspaceTimeline: (engagementId) => fetchApi(`/api/workspaces/${engagementId}/timeline`),
  createWorkspaceMilestone: (engagementId, payload) =>
    fetchApi(`/api/workspaces/${engagementId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkspaceMilestone: (engagementId, milestoneId, payload) =>
    fetchApi(`/api/workspaces/${engagementId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  uploadDeliverableFile: (engagementId, formData) => {
    const token = localStorage.getItem('kivora_token') || localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/api/workspaces/${engagementId}/upload-deliverable`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    });
  },
  submitDeliverableVersion: (engagementId, payload) =>
    fetchApi(`/api/workspaces/${engagementId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  requestDeliverableRevision: (engagementId, payload) =>
    fetchApi(`/api/workspaces/${engagementId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveDeliverableVersion: (engagementId) =>
    fetchApi(`/api/workspaces/${engagementId}/approve`, {
      method: 'POST',
    }),
  completeWorkspaceEngagement: (engagementId) =>
    fetchApi(`/api/workspaces/${engagementId}/complete`, {
      method: 'POST',
    }),
  compareDeliverableVersions: (engagementId, vA, vB) =>
    fetchApi(`/api/workspaces/${engagementId}/compare?v_a=${vA}&v_b=${vB}`),
  requestAiReview: (engagementId, deliverableId, mockScore) => {
    const qs = mockScore ? `?mock_score=${mockScore}` : '';
    return fetchApi(`/api/workspaces/${engagementId}/deliverables/${deliverableId}/ai-review${qs}`, {
      method: 'POST',
    });
  },
  getAiReview: (engagementId, deliverableId) =>
    fetchApi(`/api/workspaces/${engagementId}/deliverables/${deliverableId}/ai-review`),
  submitCollaborationReview: (engagementId, payload) =>
    fetchApi(`/api/workspaces/${engagementId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getProfileReviewSummary: (profileId, role = 'CREATOR') =>
    fetchApi(`/api/workspaces/reviews/summary/${profileId}?role=${role}`),
  getBrandCollaborationHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return fetchApi(`/api/workspaces/history/brand${qs ? `?${qs}` : ''}`);
  },
  getCreatorCollaborationHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.skip) query.append('skip', params.skip);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return fetchApi(`/api/workspaces/history/creator${qs ? `?${qs}` : ''}`);
  },
};

export default api;


