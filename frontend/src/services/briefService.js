import { fetchApi } from './api';

export const briefService = {
  getBriefs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/briefs${query ? `?${query}` : ''}`);
  },
  getBriefDetail: (slugOrId) => {
    return fetchApi(`/api/briefs/${slugOrId}`);
  },
  createBrief: (briefData) => {
    return fetchApi('/api/briefs', {
      method: 'POST',
      body: JSON.stringify(briefData),
    });
  },
  applyToBrief: (briefId, appData) => {
    return fetchApi(`/api/briefs/${briefId}/apply`, {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },
  getBriefApplications: (briefId) => {
    return fetchApi(`/api/briefs/${briefId}/applications`);
  },
  updateApplicationStatus: (appId, statusData) => {
    return fetchApi(`/api/briefs/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },
};
