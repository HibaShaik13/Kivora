import { fetchApi } from './api';

export const verificationService = {
  triggerAnalysis: (verificationId) => {
    return fetchApi(`/api/verification/requests/${verificationId}/analyze`, {
      method: 'POST',
    });
  },

  getAiAnalysis: (verificationId) => {
    return fetchApi(`/api/verification/requests/${verificationId}/ai-analysis`);
  },

  getRequests: (status = '') => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/api/verification/requests${query}`);
  },

  getMyRequests: () => {
    return fetchApi('/api/verification/my-requests');
  },

  reviewRequest: (verificationId, status, notes = '') => {
    return fetchApi(`/api/verification/requests/${verificationId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        reviewer_notes: notes,
      }),
    });
  },
};
