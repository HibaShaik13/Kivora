import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function EditCreatorProfileModal({ isOpen, onClose, onProfileUpdated, currentProfile }) {
  const [displayName, setDisplayName] = useState(currentProfile?.display_name || '');
  const [handle, setHandle] = useState(currentProfile?.handle || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatar_url || '/assets/avatars/elena.jpg');
  const [bannerUrl, setBannerUrl] = useState(currentProfile?.banner_url || '/assets/banners/elena_banner.jpg');
  const [location, setLocation] = useState(currentProfile?.location || 'Tokyo / Global');
  const [yearsExperience, setYearsExperience] = useState(currentProfile?.years_experience || 4);
  const [primarySpecialization, setPrimarySpecialization] = useState(
    currentProfile?.primary_specialization || 'Cinematic Generative Video'
  );
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.website_url || 'https://kivora.dev/@creator');
  const [minBudget, setMinBudget] = useState(currentProfile?.min_budget || 2500);
  const [hourlyRate, setHourlyRate] = useState(currentProfile?.hourly_rate || 150);

  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState(
    currentProfile?.skills?.map((s) => s.skill_id) || []
  );
  const [selectedToolIds, setSelectedToolIds] = useState(
    currentProfile?.tools?.map((t) => t.tool_id) || []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const [skills, tools] = await Promise.all([api.getSkills(), api.getTools()]);
        setAvailableSkills(skills || []);
        setAvailableTools(tools || []);
        if ((!currentProfile?.skills || currentProfile.skills.length === 0) && skills?.length) {
          setSelectedSkillIds(skills.slice(0, 2).map((s) => s.id));
        }
        if ((!currentProfile?.tools || currentProfile.tools.length === 0) && tools?.length) {
          setSelectedToolIds(tools.slice(0, 2).map((t) => t.id));
        }
      } catch (err) {
        console.error('Failed to load taxonomy:', err);
      }
    }
    loadTaxonomy();
  }, [currentProfile]);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name || '');
      setHandle(currentProfile.handle || '');
      setBio(currentProfile.bio || '');
      setAvatarUrl(currentProfile.avatar_url || '/assets/avatars/elena.jpg');
      setBannerUrl(currentProfile.banner_url || '/assets/banners/elena_banner.jpg');
      setLocation(currentProfile.location || 'Tokyo / Global');
      setYearsExperience(currentProfile.years_experience || 4);
      setPrimarySpecialization(currentProfile.primary_specialization || 'Cinematic Generative Video');
      setWebsiteUrl(currentProfile.website_url || 'https://kivora.dev/@creator');
      setMinBudget(currentProfile.min_budget || 2500);
      setHourlyRate(currentProfile.hourly_rate || 150);
      if (currentProfile.skills?.length) {
        setSelectedSkillIds(currentProfile.skills.map((s) => s.skill_id));
      }
      if (currentProfile.tools?.length) {
        setSelectedToolIds(currentProfile.tools.map((t) => t.tool_id));
      }
    }
  }, [currentProfile]);

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
    setIsLoading(true);
    setError(null);

    const payload = {
      display_name: displayName,
      handle: handle.replace('@', ''),
      bio,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      location,
      years_experience: parseInt(yearsExperience, 10) || 1,
      primary_specialization: primarySpecialization,
      website_url: websiteUrl,
      min_budget: parseFloat(minBudget) || 1000,
      hourly_rate: parseFloat(hourlyRate) || 100,
      skill_ids: selectedSkillIds,
      tool_ids: selectedToolIds,
    };

    try {
      const updated = await api.setupOrUpdateCreatorProfile(payload);
      if (onProfileUpdated) onProfileUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update creator profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.96)), url(/assets/backgrounds/creator-profile.jpg)',
          backgroundSize: 'cover',
        }}
      >
        <div className="modal-header">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              CREATOR PASSPORT
            </span>
            <h2 className="modal-title">Edit Creator Profile</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Display Name *</label>
              <input
                type="text"
                className="input-text w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                required
              />
            </div>
            <div>
              <label className="label-form">Handle / Username *</label>
              <input
                type="text"
                className="input-text w-full"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="elenarostova"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-form">Biography & Creative Manifesto</label>
            <textarea
              className="input-text w-full"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell brands about your artistic direction, multi-model pipelines, and commercial production standards."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Primary Specialization</label>
              <input
                type="text"
                className="input-text w-full"
                value={primarySpecialization}
                onChange={(e) => setPrimarySpecialization(e.target.value)}
                placeholder="e.g. Cinematic Generative Video"
              />
            </div>
            <div>
              <label className="label-form">Location / Timezone</label>
              <input
                type="text"
                className="input-text w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tokyo / UTC+9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-form">Years Experience</label>
              <input
                type="number"
                className="input-text w-full"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="label-form">Min Project Budget ($)</label>
              <input
                type="number"
                className="input-text w-full"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="label-form">Hourly Rate ($)</label>
              <input
                type="number"
                className="input-text w-full"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Avatar URL</label>
              <input
                type="text"
                className="input-text w-full"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/assets/avatars/elena.jpg"
              />
            </div>
            <div>
              <label className="label-form">Banner URL</label>
              <input
                type="text"
                className="input-text w-full"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="/assets/banners/elena_banner.jpg"
              />
            </div>
          </div>

          <div>
            <label className="label-form">Website / Portfolio Link</label>
            <input
              type="url"
              className="input-text w-full"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://elenarostova.art"
            />
          </div>

          {/* Skills Checklist */}
          <div>
            <label className="label-form">Creative Skills & Disciplines</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-black/10 bg-white/60">
              {availableSkills.map((sk) => {
                const isSelected = selectedSkillIds.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => toggleSkill(sk.id)}
                    className={`tag-pill text-xs transition ${
                      isSelected
                        ? 'bg-purple-600 text-white font-semibold border-purple-600'
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

          {/* Tools Checklist */}
          <div>
            <label className="label-form">Generative AI Tools & Pipeline Stacks</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-black/10 bg-white/60">
              {availableTools.map((tl) => {
                const isSelected = selectedToolIds.includes(tl.id);
                return (
                  <button
                    key={tl.id}
                    type="button"
                    onClick={() => toggleTool(tl.id)}
                    className={`tag-pill text-xs transition ${
                      isSelected
                        ? 'bg-purple-600 text-white font-semibold border-purple-600'
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
