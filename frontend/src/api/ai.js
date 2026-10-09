/**
 * AI Services API Service
 * Maps to /api/ai endpoints
 */

import api from './client';

export const aiApi = {
  generateBrief: (data) => api.post('/api/ai/generate-brief', data),
};
