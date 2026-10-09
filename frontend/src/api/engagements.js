/**
 * Engagements & Deliverable Milestones API Service
 * Maps to /api/engagements endpoints
 */

import api from './client';

export const engagementsApi = {
  list: (params = {}) => api.get('/api/engagements', { params, requiresAuth: true }),
  getDetail: (engagementId) => api.get(`/api/engagements/${engagementId}`, { requiresAuth: true }),
  submitDeliverable: (engagementId, data) =>
    api.post(`/api/engagements/${engagementId}/deliverables`, data, { requiresAuth: true }),
  requestRevisions: (engagementId, data) =>
    api.post(`/api/engagements/${engagementId}/revisions`, data, { requiresAuth: true }),
  approve: (engagementId) => api.post(`/api/engagements/${engagementId}/approve`, {}, { requiresAuth: true }),
  review: (engagementId, data) => api.post(`/api/engagements/${engagementId}/review`, data, { requiresAuth: true }),
  updateStatus: (engagementId, status) =>
    api.patch(`/api/engagements/${engagementId}/status`, { status }, { requiresAuth: true }),
};
