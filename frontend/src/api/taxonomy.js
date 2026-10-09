/**
 * Taxonomy API Service
 * Maps to /api/taxonomy/skills and /api/taxonomy/tools
 */

import api from './client';

export const taxonomyApi = {
  getSkills: () => api.get('/api/taxonomy/skills'),
  getTools: () => api.get('/api/taxonomy/tools'),
};
