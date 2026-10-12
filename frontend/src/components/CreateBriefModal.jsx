import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function CreateBriefModal({ isOpen, onClose, onBriefCreated, initialData = null }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [campaignObjective, setCampaignObjective] = useState(
    initialData?.campaign_objective || ''
  );
  const [targetAudience, setTargetAudience] = useState(
    initialData?.target_audience || 'Global Luxury Skincare Consumers (25-45)'
  );
  const [contentType, setContentType] = useState(initialData?.content_type || 'VIDEO');
  const [creativeStyleMood, setCreativeStyleMood] = useState(
    initialData?.creative_style_mood || 'Hyper-realistic, soft luminous dawn lighting, serene organic motion'
  );
  const [aspectRatio, setAspectRatio] = useState(initialData?.aspect_ratio || '16:9');
  const [durationMin, setDurationMin] = useState(initialData?.duration_seconds_min || 15);
  const [durationMax, setDurationMax] = useState(initialData?.duration_seconds_max || 30);
  const [resolutionMin, setResolutionMin] = useState(initialData?.resolution_min || '3840x2160');
  const [deliverablesDescription, setDeliverablesDescription] = useState(
    initialData?.deliverables_description || '1x 4K Master Hero Film, 2x Social Cutdowns (9:16), Clean ProRes master files with prompt seed manifest.'
  );
  const [revisionAllowance, setRevisionAllowance] = useState(initialData?.revision_allowance || 2);
  const [budgetAmount, setBudgetAmount] = useState(initialData?.budget_amount || 4500);
  const [budgetCurrency, setBudgetCurrency] = useState(initialData?.budget_currency || 'USD');
  const [deadlineDays, setDeadlineDays] = useState(initialData?.deadline_days || 14);
  const [commercialRequirements, setCommercialRequirements] = useState(
    initialData?.commercial_use_requirements || 'Full Commercial Buyout with global broadcast rights'
  );
  const [usageChannels, setUsageChannels] = useState(
    initialData?.usage_channels || 'Digital Paid Ads, Social Media, Website Hero'
  );
  const [usageDuration, setUsageDuration] = useState(initialData?.usage_duration || 'Perpetual / 2 Years');
  const [usageTerritories, setUsageTerritories] = useState(
    initialData?.usage_territories || 'Worldwide'
  );
  const [restrictions, setRestrictions] = useState(
    initialData?.restrictions_and_guidelines || 'No distorted anatomical artifacts, realistic fluid viscosity, color grade aligned with hex #FAF7F2 palette.'
  );
  const [disclosure, setDisclosure] = useState(
    initialData?.disclosure_requirements || 'Creator must disclose specific generative AI models used and attach reproducibility workflow evidence.'
  );

  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState(
    initialData?.required_skill_ids || ['skill-camera-control', 'skill-macro-fluid']
  );
  const [selectedToolIds, setSelectedToolIds] = useState(
    initialData?.required_tool_ids || ['tool-runway-gen3', 'tool-comfyui']
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const [skills, tools] = await Promise.all([api.getSkills(), api.getTools()]);
        setAvailableSkills(skills || []);
        setAvailableTools(tools || []);
      } catch (err) {
        console.error('Failed to load taxonomy:', err);
      }
    }
    loadTaxonomy();
  }, []);

  if (!isOpen) return null;

  const toggleSkill = (id) => {
    if (selectedSkillIds.includes(id)) {
      setSelectedSkillIds(selectedSkillIds.filter((s) => s !== id));
    } else {
      setSelectedSkillIds([...selectedSkillIds, id]);
    }
  };

  const toggleTool = (id) => {
    if (selectedToolIds.includes(id)) {
      setSelectedToolIds(selectedToolIds.filter((t) => t !== id));
    } else {
      setSelectedToolIds([...selectedToolIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const validSkillIds = availableSkills.length > 0
      ? selectedSkillIds.filter((id) => availableSkills.some((s) => s.id === id))
      : selectedSkillIds;
    const validToolIds = availableTools.length > 0
      ? selectedToolIds.filter((id) => availableTools.some((t) => t.id === id))
      : selectedToolIds;

    const payload = {
      title: title.trim(),
      campaign_objective: campaignObjective.trim(),
      target_audience: targetAudience.trim(),
      content_type: contentType,
      creative_style_mood: creativeStyleMood.trim(),
      aspect_ratio: aspectRatio,
      duration_seconds_min: contentType === 'IMAGE' ? null : parseInt(durationMin, 10),
      duration_seconds_max: contentType === 'IMAGE' ? null : parseInt(durationMax, 10),
      resolution_min: resolutionMin,
      deliverables_description: deliverablesDescription.trim(),
      revision_allowance: parseInt(revisionAllowance, 10) || 2,
      budget_amount: parseFloat(budgetAmount),
      budget_currency: budgetCurrency,
      deadline_days: parseInt(deadlineDays, 10) || 14,
      commercial_use_requirements: commercialRequirements.trim(),
      usage_channels: usageChannels.trim(),
      usage_duration: usageDuration.trim(),
      usage_territories: usageTerritories.trim(),
      restrictions_and_guidelines: restrictions.trim(),
      disclosure_requirements: disclosure.trim(),
      required_skill_ids: validSkillIds,
      required_tool_ids: validToolIds,
    };

    try {
      const created = await api.createBrief(payload);
      if (onBriefCreated) onBriefCreated(created);
      onClose();
    } catch (err) {
      console.error('Failed to create campaign brief:', err);
      setError(err.message || 'Failed to create campaign brief.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.96)), url(/assets/backgrounds/briefs-explorer.jpg)',
          backgroundSize: 'cover',
        }}
      >
        <div className="modal-header">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              STRUCTURED CAMPAIGN BRIEF
            </span>
            <h2 className="modal-title">Launch Campaign Brief</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="banner-error mb-4" style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label-form">Campaign Title *</label>
              <input
                type="text"
                className="input-text w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lumina Hydration Serum Launch Commercial"
                required
              />
            </div>
            <div>
              <label className="label-form">Content Type *</label>
              <select
                className="input-text w-full"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="VIDEO">Video Commercial</option>
                <option value="IMAGE">Still Key Visual</option>
                <option value="ANIMATION">Motion Loop / 3D Animation</option>
                <option value="3D_MODEL">3D Spatial Asset</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-form">Campaign Objective & Core Message *</label>
            <textarea
              className="input-text w-full"
              rows={3}
              value={campaignObjective}
              onChange={(e) => setCampaignObjective(e.target.value)}
              placeholder="Detail what this creative piece will achieve, brand positioning, and hero story."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Target Audience</label>
              <input
                type="text"
                className="input-text w-full"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Gen Z skincare enthusiasts"
              />
            </div>
            <div>
              <label className="label-form">Aesthetic Mood & Tone</label>
              <input
                type="text"
                className="input-text w-full"
                value={creativeStyleMood}
                onChange={(e) => setCreativeStyleMood(e.target.value)}
                placeholder="e.g. Ethereal, hyper-minimalist, high-key"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="label-form">Aspect Ratio</label>
              <select
                className="input-text w-full"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Story / Reel</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:5">4:5 Social Feed</option>
              </select>
            </div>
            <div>
              <label className="label-form">Min Resolution</label>
              <input
                type="text"
                className="input-text w-full"
                value={resolutionMin}
                onChange={(e) => setResolutionMin(e.target.value)}
                placeholder="3840x2160"
              />
            </div>
            <div>
              <label className="label-form">Budget Amount ($)</label>
              <input
                type="number"
                className="input-text w-full font-bold text-purple-700"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                required
                min={100}
              />
            </div>
            <div>
              <label className="label-form">Timeline (Days)</label>
              <input
                type="number"
                className="input-text w-full"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="label-form">Deliverables Description</label>
            <textarea
              className="input-text w-full"
              rows={2}
              value={deliverablesDescription}
              onChange={(e) => setDeliverablesDescription(e.target.value)}
              placeholder="Master ProRes 4444 file, stems, audio sync, workflow prompt seeds..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Commercial Rights & Licensing</label>
              <input
                type="text"
                className="input-text w-full"
                value={commercialRequirements}
                onChange={(e) => setCommercialRequirements(e.target.value)}
                placeholder="Full Commercial Buyout"
              />
            </div>
            <div>
              <label className="label-form">Usage Territories</label>
              <input
                type="text"
                className="input-text w-full"
                value={usageTerritories}
                onChange={(e) => setUsageTerritories(e.target.value)}
                placeholder="Worldwide / Multi-market"
              />
            </div>
          </div>

          {/* Required Skills & Tools */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="label-form">Required Skills</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg border border-black/10 bg-white/60">
                {availableSkills.map((sk) => {
                  const isSelected = selectedSkillIds.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => toggleSkill(sk.id)}
                      className={`tag-pill text-xs transition ${
                        isSelected
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-white text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sk.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label-form">Preferred AI Tool Stacks</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg border border-black/10 bg-white/60">
                {availableTools.map((tl) => {
                  const isSelected = selectedToolIds.includes(tl.id);
                  return (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => toggleTool(tl.id)}
                      className={`tag-pill text-xs transition ${
                        isSelected
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-white text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tl.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Publishing Brief...' : 'Publish Campaign Brief'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
