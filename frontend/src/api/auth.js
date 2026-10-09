/**
 * Authentication API Service
 * Maps directly to backend /api/auth endpoints
 */

import api from './client';

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
  resendOtp: (data) => api.post('/api/auth/resend-otp', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me', { requiresAuth: true }),
};
