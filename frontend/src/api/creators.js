/**
 * Creators API Service
 * Maps directly to backend /api/creators endpoints
 */

import api from './client';

export const creatorsApi = {
  list: (params = {}) => api.get('/api/creators', { params }),
  getDetail: (slugOrId) => api.get(`/api/creators/${slugOrId}`),
  getMyProfile: () => api.get('/api/creators/me', { requiresAuth: true }),
  setupOrUpdateProfile: (data) => api.post('/api/creators/profile', data, { requiresAuth: true }),
  updateProfilePut: (data) => api.put('/api/creators/profile', data, { requiresAuth: true }),
  
  // Portfolio
  createPortfolioProject: (data) => api.post('/api/creators/portfolio', data, { requiresAuth: true }),
  getPortfolioProjectDetail: (projectId) => api.get(`/api/creators/portfolio/${projectId}`),
  updatePortfolioProject: (projectId, data) => api.put(`/api/creators/portfolio/${projectId}`, data, { requiresAuth: true }),
  deletePortfolioProject: (projectId) => api.delete(`/api/creators/portfolio/${projectId}`, { requiresAuth: true }),
  
  // Evidence & Workflow steps
  addProjectEvidence: (projectId, data) => api.post(`/api/creators/portfolio/${projectId}/evidence`, data, { requiresAuth: true }),
  addWorkflowStep: (projectId, data) => api.post(`/api/creators/portfolio/${projectId}/workflow-step`, data, { requiresAuth: true }),
};
