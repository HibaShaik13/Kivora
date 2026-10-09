/**
 * Campaign Briefs & Applications API Service
 * Maps to /api/briefs endpoints
 */

import api from './client';

export const briefsApi = {
  list: (params = {}) => api.get('/api/briefs', { params }),
  getMyBriefs: () => api.get('/api/briefs/my-briefs', { requiresAuth: true }),
  getDetail: (slugOrId) => api.get(`/api/briefs/${slugOrId}`),
  create: (data) => api.post('/api/briefs', data, { requiresAuth: true }),
  update: (briefId, data) => api.put(`/api/briefs/${briefId}`, data, { requiresAuth: true }),
  updateStatus: (briefId, status) => api.patch(`/api/briefs/${briefId}/status`, { status }, { requiresAuth: true }),
  deleteOrCancel: (briefId) => api.delete(`/api/briefs/${briefId}`, { requiresAuth: true }),
  
  // Applications
  apply: (briefId, data) => api.post(`/api/briefs/${briefId}/apply`, data, { requiresAuth: true }),
  getMyApplications: () => api.get('/api/briefs/applications/my-applications', { requiresAuth: true }),
  getBriefApplications: (briefId) => api.get(`/api/briefs/${briefId}/applications`, { requiresAuth: true }),
  updateApplicationStatus: (applicationId, data) =>
    api.patch(`/api/briefs/applications/${applicationId}/status`, data, { requiresAuth: true }),
};
