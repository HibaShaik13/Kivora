import { fetchApi } from './api';

export const aiService = {
  generateStructuredBrief: (prompt, brandIndustry = null, targetBudget = null) => {
    return fetchApi('/api/ai/generate-brief', {
      method: 'POST',
      body: JSON.stringify({
        raw_prompt: prompt,
        brand_industry: brandIndustry,
        target_budget: targetBudget,
      }),
    });
  },
};
