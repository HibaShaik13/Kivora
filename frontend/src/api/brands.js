/**
 * Brands API Service
 * Maps to /api/brands endpoints
 */

import api from './client';

export const brandsApi = {
  list: () => api.get('/api/brands'),
  getMyProfile: () => api.get('/api/brands/me', { requiresAuth: true }),
  getDetail: (slugOrId) => api.get(`/api/brands/${slugOrId}`),
  setupProfile: (data) => api.post('/api/brands/profile', data, { requiresAuth: true }),
  updateProfile: (data) => api.put('/api/brands/profile', data, { requiresAuth: true }),
};
