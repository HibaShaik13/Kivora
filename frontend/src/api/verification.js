/**
 * Verification & Evidence Auditing API Service
 * Maps to /api/verification endpoints
 */

import api from './client';

export const verificationApi = {
  submitRequest: (data) => api.post('/api/verification/request', data, { requiresAuth: true }),
  getMyRequests: () => api.get('/api/verification/my-requests', { requiresAuth: true }),
  
  // Admin only
  listRequestsAdmin: (params = {}) => api.get('/api/verification/requests', { params, requiresAuth: true }),
  reviewRequestAdmin: (verificationId, data) =>
    api.patch(`/api/verification/requests/${verificationId}`, data, { requiresAuth: true }),
  triggerAiAnalysis: (verificationId) =>
    api.post(`/api/verification/requests/${verificationId}/analyze`, {}, { requiresAuth: true }),
  getAiAnalysis: (verificationId) =>
    api.get(`/api/verification/requests/${verificationId}/ai-analysis`, { requiresAuth: true }),
};
