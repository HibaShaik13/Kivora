import React, { useState } from 'react';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';

export default function AiBriefBuilderModal({ isOpen, onClose, onBriefCreated }) {
  const [step, setStep] = useState('prompt'); // 'prompt' | 'review'
  const [prompt, setPrompt] = useState('');
  const [brandIndustry, setBrandIndustry] = useState('Skincare & Beauty');
  const [targetBudget, setTargetBudget] = useState('5000');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [generatedBrief, setGeneratedBrief] = useState(null);

  if (!isOpen) return null;

  const currentUser = getCurrentUser();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 10) {
      setError('Prompt must be at least 10 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.generateAiBrief({
        raw_prompt: prompt,
        brand_industry: brandIndustry || undefined,
        target_budget: targetBudget ? parseFloat(targetBudget) : undefined,
      });

      setGeneratedBrief({
        ...response,
        budget_amount: response.budget_amount || (targetBudget ? parseFloat(targetBudget) : 5000),
        budget_currency: response.budget_currency || 'USD',
        status: 'PUBLISHED',
      });
      setStep('review');
    } catch (err) {
      setError(err.message || 'Failed to generate brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setGeneratedBrief((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePublish = async () => {
    if (!currentUser || currentUser.role !== 'BRAND') {
      setError('You must be logged in as a verified BRAND to publish briefs.');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const payload = {
        title: generatedBrief.title,
        campaign_objective: generatedBrief.campaign_objective,
        target_audience: generatedBrief.target_audience,
        content_type: generatedBrief.content_type,
        creative_style_mood: generatedBrief.creative_style_mood,
        aspect_ratio: generatedBrief.aspect_ratio || '16:9',
        duration_seconds_min: generatedBrief.duration_seconds_min || 15,
        duration_seconds_max: generatedBrief.duration_seconds_max || 60,
        resolution_min: generatedBrief.resolution_min || '4K UHD',
        deliverables_description: generatedBrief.deliverables_description,
        revision_allowance: generatedBrief.revision_allowance || 2,
        budget_amount: parseFloat(generatedBrief.budget_amount),
        budget_currency: generatedBrief.budget_currency || 'USD',
        deadline_days: 21,
        commercial_use_requirements: generatedBrief.commercial_use_requirements || 'Full commercial rights',
        usage_channels: generatedBrief.usage_channels || 'Digital & Social Media',
        usage_duration: generatedBrief.usage_duration || '12 Months',
        usage_territories: generatedBrief.usage_territories || 'Worldwide',
        restrictions_and_guidelines: generatedBrief.restrictions_and_guidelines || 'No competitor logos',
        disclosure_requirements: generatedBrief.disclosure_requirements || 'Must state AI Assisted Production',
        status: 'PUBLISHED',
        required_skill_ids: [],
        required_tool_ids: [],
      };

      const result = await api.createBrief(payload);
      if (onBriefCreated) onBriefCreated(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish brief.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="badge-ai text-sm px-3 py-1 font-mono">✦ GEMINI 2.5 FLASH SYNTHESIZER</span>
            <h2 className="text-xl font-bold text-white">AI Brief Builder</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="banner-error mb-4">
              <span className="font-semibold">Notice:</span> {error}
            </div>
          )}

          {step === 'prompt' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <p className="text-sm text-neutral-300">
                Transform rough ideas, creative hooks, or product descriptions into commercial-grade campaign specifications in seconds using multimodal AI analysis.
              </p>

              <div>
                <label className="label-form">Campaign Concept / Creative Prompt *</label>
                <textarea
                  className="input-textarea h-32"
                  placeholder="e.g. Launching a high-end botanical serum. We need cinematic 4K macro video footage with fluid simulations of droplets and radiant golden light. Target audience is luxury skincare buyers aged 25-45..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Brand Industry</label>
                  <select
                    className="input-select"
                    value={brandIndustry}
                    onChange={(e) => setBrandIndustry(e.target.value)}
                  >
                    <option value="Skincare & Beauty">Skincare & Beauty</option>
                    <option value="Sci-Fi & Film Promotion">Sci-Fi & Film Promotion</option>
                    <option value="Automotive & Luxury Tech">Automotive & Luxury Tech</option>
                    <option value="Fashion & Haute Couture">Fashion & Haute Couture</option>
                    <option value="Beverage & Luxury Goods">Beverage & Luxury Goods</option>
                    <option value="Anime & Gaming Animation">Anime & Gaming Animation</option>
                  </select>
                </div>

                <div>
                  <label className="label-form">Target Budget (USD)</label>
                  <input
                    type="number"
                    className="input-text"
                    placeholder="e.g. 5000"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                  />
                </div>
              </div>

              {/* Inspiration Pills */}
              <div>
                <span className="text-xs text-neutral-400 block mb-2">Try quick prompt ideas:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs bg-surface-2 hover:bg-surface-3 text-neutral-300 px-2.5 py-1.5 rounded border border-white/5 transition"
                    onClick={() => {
                      setPrompt("Cinematic 15-second teaser for Solaris: Deep Space Anomaly. Needs photorealistic alien atmosphere, volumetric fog, and Unreal/ComfyUI camera tracking.");
                      setBrandIndustry("Sci-Fi & Film Promotion");
                      setTargetBudget("6000");
                    }}
                  >
                    🚀 Sci-Fi Film Teaser
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-surface-2 hover:bg-surface-3 text-neutral-300 px-2.5 py-1.5 rounded border border-white/5 transition"
                    onClick={() => {
                      setPrompt("3D photorealistic glass perfume bottle advertisement with amber liquid, subtle caustics, and studio backlight reflection. 1:1 format for e-commerce and socials.");
                      setBrandIndustry("Beverage & Luxury Goods");
                      setTargetBudget("4000");
                    }}
                  >
                    ✨ Luxury Bottle Visual
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-surface-2 hover:bg-surface-3 text-neutral-300 px-2.5 py-1.5 rounded border border-white/5 transition"
                    onClick={() => {
                      setPrompt("Dynamic 30s anime action sequence featuring a futuristic neon samurai running through atmospheric rain. Needs stylized cel-shading and fluid blade trails.");
                      setBrandIndustry("Anime & Gaming Animation");
                      setTargetBudget("5500");
                    }}
                  >
                    ⚡ Neon Cyber Samurai
                  </button>
                </div>
              </div>

              <div className="modal-footer pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-neutral-500 font-mono">
                  Engine: Gemini 2.5 Flash / Fallback Synthesizer
                </span>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-sm" />
                      Synthesizing Brief...
                    </>
                  ) : (
                    <>✦ Synthesize Brief with AI</>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-xs text-brand-cyan flex items-center justify-between">
                <span>
                  ✓ Generated via <strong>{generatedBrief.generation_engine || 'Gemini 2.5 Flash'}</strong>. Review & edit specifications before posting.
                </span>
                <button
                  type="button"
                  className="text-xs underline hover:text-white"
                  onClick={() => setStep('prompt')}
                >
                  Edit Prompt
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-form">Campaign Title</label>
                  <input
                    type="text"
                    className="input-text font-semibold text-white"
                    value={generatedBrief.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="label-form">Campaign Objective</label>
                  <textarea
                    className="input-textarea h-20"
                    value={generatedBrief.campaign_objective || ''}
                    onChange={(e) => handleFieldChange('campaign_objective', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Target Audience</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.target_audience || ''}
                    onChange={(e) => handleFieldChange('target_audience', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Content Type</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.content_type || ''}
                    onChange={(e) => handleFieldChange('content_type', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Creative Style & Mood</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.creative_style_mood || ''}
                    onChange={(e) => handleFieldChange('creative_style_mood', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Aspect Ratio & Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input-text"
                      value={generatedBrief.aspect_ratio || '16:9'}
                      onChange={(e) => handleFieldChange('aspect_ratio', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-text"
                      value={generatedBrief.resolution_min || '4K UHD'}
                      onChange={(e) => handleFieldChange('resolution_min', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-form">Budget Amount ({generatedBrief.budget_currency || 'USD'})</label>
                  <input
                    type="number"
                    className="input-text"
                    value={generatedBrief.budget_amount || 5000}
                    onChange={(e) => handleFieldChange('budget_amount', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Revisions Allowed</label>
                  <input
                    type="number"
                    className="input-text"
                    value={generatedBrief.revision_allowance || 2}
                    onChange={(e) => handleFieldChange('revision_allowance', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="label-form">Deliverables Description</label>
                  <textarea
                    className="input-textarea h-20"
                    value={generatedBrief.deliverables_description || ''}
                    onChange={(e) => handleFieldChange('deliverables_description', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="label-form">Commercial Rights & Usage</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.commercial_use_requirements || ''}
                    onChange={(e) => handleFieldChange('commercial_use_requirements', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep('prompt')}
                >
                  ← Back to Prompt
                </button>

                <div className="flex items-center gap-3">
                  {!currentUser ? (
                    <span className="text-xs text-amber-400">
                      Sign in as Lumina Brand to publish
                    </span>
                  ) : currentUser.role !== 'BRAND' ? (
                    <span className="text-xs text-amber-400">
                      Switch to Brand profile to publish
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing || !currentUser || currentUser.role !== 'BRAND'}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <div className="spinner-sm" />
                        Publishing to Marketplace...
                      </>
                    ) : (
                      <>Publish Brief to Marketplace →</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
