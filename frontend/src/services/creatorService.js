import { fetchApi } from './api';
import { localizeCreators, localizeCreator } from '../utils/indianLocalization';

export const creatorService = {
  getCreators: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await fetchApi(`/api/creators${query ? `?${query}` : ''}`);
    if (Array.isArray(data)) {
      return localizeCreators(data);
    }
    if (data && Array.isArray(data.items)) {
      return { ...data, items: localizeCreators(data.items) };
    }
    return data;
  },
  getCreatorDetail: async (slugOrId) => {
    const data = await fetchApi(`/api/creators/${slugOrId}`);
    return localizeCreator(data);
  },
};
