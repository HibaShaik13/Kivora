/**
 * Explainable Matching API Service
 * Maps to /api/match endpoints
 */

import api from './client';

export const matchingApi = {
  getBriefMatches: (briefId, params = {}) => api.get(`/api/match/briefs/${briefId}`, { params }),
};
