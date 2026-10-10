import { fetchApi } from './api';

export const matchingService = {
  getBriefMatches: (briefId, minScore = 0.0) => {
    return fetchApi(`/api/match/briefs/${briefId}?min_score=${minScore}`);
  },
};
