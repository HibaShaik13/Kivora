import { fetchApi } from './api';

export const creatorService = {
  getCreators: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/creators${query ? `?${query}` : ''}`);
  },
  getCreatorDetail: (slugOrId) => {
    return fetchApi(`/api/creators/${slugOrId}`);
  },
};
