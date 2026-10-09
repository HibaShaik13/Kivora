/**
 * Media Upload API Service
 * Maps to /api/media/upload multipart endpoint
 */

import api from './client';

export const mediaApi = {
  uploadFile: (file, category = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return api.upload('/api/media/upload', formData, { requiresAuth: true });
  },
};
