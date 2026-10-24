import { fetchApi } from './api';
import { localizeCreator } from '../utils/indianLocalization';

export const matchingService = {
  getBriefMatches: async (briefId, minScore = 0.0) => {
    const data = await fetchApi(`/api/match/briefs/${briefId}?min_score=${minScore}`);
    if (data && Array.isArray(data.matches)) {
      data.matches = data.matches.map((m) => {
        const localized = localizeCreator({
          id: m.creator_id,
          display_name: m.display_name,
          handle: m.handle,
          avatar_url: m.avatar_url,
          location: m.location || '',
          min_budget: m.min_budget,
        });
        return {
          ...m,
          display_name: localized.display_name,
          handle: localized.handle,
          avatar_url: localized.avatar_url,
          location: localized.location || m.location || 'Bengaluru, Karnataka',
          min_budget: localized.min_budget ?? m.min_budget,
        };
      });
    }
    return data;
  },
};
