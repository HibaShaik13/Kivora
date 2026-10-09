import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  WarningCircle,
  ArrowsClockwise,
  CheckCircle,
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { creatorsApi } from '../api/creators';
import { brandsApi } from '../api/brands';
import { taxonomyApi } from '../api/taxonomy';
import { useToast } from '../hooks/useToast';

export default function OnboardingPage() {
  const { user, refreshUser, isCreator, isBrand } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Taxonomy states
  const [availableTools, setAvailableTools] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Creator profile state
  const [creatorForm, setCreatorForm] = useState({
    display_name: '',
    handle: '',
    bio: '',
    location: '',
    years_experience: 2,
    primary_specialization: 'AI Filmmaking & Generative Video',
    website_url: '',
    min_budget: 500,
    hourly_rate: 100,
    selectedTools: [],
    selectedSkills: [],
  });

  // Brand profile state
  const [brandForm, setBrandForm] = useState({
    company_name: '',
    slug: '',
    industry: 'Beauty & Cosmetics',
    website_url: '',
    description: '',
    company_size: '10-50',
    headquarters: 'New York, USA',
  });

  // Load taxonomy for creator onboarding
  useEffect(() => {
    if (isCreator) {
      Promise.all([taxonomyApi.getTools(), taxonomyApi.getSkills()])
        .then(([tools, skills]) => {
          setAvailableTools(tools || []);
          setAvailableSkills(skills || []);
          // Default pre-select first 3 tools & skills
          if (tools?.length) {
            setCreatorForm((prev) => ({
              ...prev,
              selectedTools: tools.slice(0, 3).map((t) => t.id),
            }));
          }
          if (skills?.length) {
            setCreatorForm((prev) => ({
              ...prev,
              selectedSkills: skills.slice(0, 3).map((s) => s.id),
            }));
          }
        })
        .catch((err) => console.warn('Taxonomy load error:', err));
    }
  }, [isCreator]);

  // Toggle tools selection
  const toggleTool = (toolId) => {
    setCreatorForm((prev) => {
      const exists = prev.selectedTools.includes(toolId);
      return {
        ...prev,
        selectedTools: exists
          ? prev.selectedTools.filter((id) => id !== toolId)
          : [...prev.selectedTools, toolId],
      };
    });
  };

  // Toggle skills selection
  const toggleSkill = (skillId) => {
    setCreatorForm((prev) => {
      const exists = prev.selectedSkills.includes(skillId);
      return {
        ...prev,
        selectedSkills: exists
          ? prev.selectedSkills.filter((id) => id !== skillId)
          : [...prev.selectedSkills, skillId],
      };
    });
  };

  // Submit Creator Onboarding
  const handleCreatorSubmit = async (e) => {
    e.preventDefault();
    if (!creatorForm.display_name.trim() || !creatorForm.handle.trim() || !creatorForm.bio.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await creatorsApi.setupOrUpdateProfile({
        display_name: creatorForm.display_name.trim(),
        handle: creatorForm.handle.trim().toLowerCase().replace('@', ''),
        bio: creatorForm.bio.trim(),
        location: creatorForm.location.trim() || 'Global / Remote',
        years_experience: Number(creatorForm.years_experience) || 1,
        primary_specialization: creatorForm.primary_specialization.trim(),
        website_url: creatorForm.website_url.trim() || null,
        min_budget: Number(creatorForm.min_budget) || 500,
        hourly_rate: Number(creatorForm.hourly_rate) || null,
        tool_ids: creatorForm.selectedTools,
        skill_ids: creatorForm.selectedSkills,
      });

      await refreshUser();
      showToast('Creator studio profile initialized successfully!', 'success');
      navigate('/creator/dashboard', { replace: true });
    } catch (err) {
      console.error('Creator onboarding error:', err);
      setError(err.message || 'Failed to setup creator profile.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Brand Onboarding
  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    if (!brandForm.company_name.trim() || !brandForm.description.trim()) {
      setError('Please complete all required company details.');
      return;
    }

    const cleanSlug =
      brandForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
      brandForm.company_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    setLoading(true);
    setError(null);

    try {
      await brandsApi.setupProfile({
        company_name: brandForm.company_name.trim(),
        slug: cleanSlug,
        industry: brandForm.industry.trim(),
        website_url: brandForm.website_url.trim() || null,
        description: brandForm.description.trim(),
        company_size: brandForm.company_size,
        headquarters: brandForm.headquarters.trim(),
      });

      await refreshUser();
      showToast('Brand profile initialized successfully!', 'success');
      navigate('/brand/dashboard', { replace: true });
    } catch (err) {
      console.error('Brand onboarding error:', err);
      setError(err.message || 'Failed to setup brand profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-narrow" style={{ maxWidth: '640px' }}>
        <div
          className="card-editorial"
          style={{
            padding: '40px 36px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-verified">
                <Sparkle weight="fill" size={13} />
                Profile Setup
              </span>
            </div>
            <h1 style={{ fontSize: '1.875rem', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              {isCreator ? 'Set up your creator studio' : 'Set up your brand profile'}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              {isCreator
                ? 'Declare your generative stack, creative specialization, and production minimums.'
                : 'Configure your company profile to start authoring AI briefs and hiring creators.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                border: '1px solid var(--status-error-border)',
                fontSize: '0.875rem',
                marginBottom: '24px',
              }}
            >
              <WarningCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Form: CREATOR */}
          {isCreator ? (
            <form onSubmit={handleCreatorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="creator-display-name">
                    Display / Studio Name *
                  </label>
                  <input
                    id="creator-display-name"
                    type="text"
                    required
                    value={creatorForm.display_name}
                    onChange={(e) => setCreatorForm({ ...creatorForm, display_name: e.target.value })}
                    placeholder="Elena Rostova"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="creator-handle">
                    Creator Handle *
                  </label>
                  <input
                    id="creator-handle"
                    type="text"
                    required
                    value={creatorForm.handle}
                    onChange={(e) => setCreatorForm({ ...creatorForm, handle: e.target.value })}
                    placeholder="elena_creative"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="creator-specialization">
                    Primary Specialization *
                  </label>
                  <input
                    id="creator-specialization"
                    type="text"
                    required
                    value={creatorForm.primary_specialization}
                    onChange={(e) => setCreatorForm({ ...creatorForm, primary_specialization: e.target.value })}
                    placeholder="AI Filmmaking & 3D Synthesis"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="creator-location">
                    Location *
                  </label>
                  <input
                    id="creator-location"
                    type="text"
                    required
                    value={creatorForm.location}
                    onChange={(e) => setCreatorForm({ ...creatorForm, location: e.target.value })}
                    placeholder="London, UK"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="creator-bio">
                  Studio Bio & Creative Statement *
                </label>
                <textarea
                  id="creator-bio"
                  required
                  rows={3}
                  value={creatorForm.bio}
                  onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                  placeholder="Describe your generative production expertise, workflow pipelines, and commercial creative history..."
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="creator-min-budget">
                    Min Budget ($)
                  </label>
                  <input
                    id="creator-min-budget"
                    type="number"
                    min="100"
                    value={creatorForm.min_budget}
                    onChange={(e) => setCreatorForm({ ...creatorForm, min_budget: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="creator-hourly-rate">
                    Hourly Rate ($)
                  </label>
                  <input
                    id="creator-hourly-rate"
                    type="number"
                    min="20"
                    value={creatorForm.hourly_rate}
                    onChange={(e) => setCreatorForm({ ...creatorForm, hourly_rate: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="creator-experience">
                    Experience (Yrs)
                  </label>
                  <input
                    id="creator-experience"
                    type="number"
                    min="1"
                    value={creatorForm.years_experience}
                    onChange={(e) => setCreatorForm({ ...creatorForm, years_experience: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Generative Tools Selection */}
              <div className="form-group">
                <label className="form-label">
                  Generative Stack & Tools (Select all you use):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableTools.map((t) => {
                    const isSelected = creatorForm.selectedTools.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTool(t.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          border: isSelected ? '1px solid var(--accent-lavender)' : '1px solid var(--border-medium)',
                          background: isSelected ? 'var(--accent-lavender-subtle)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--accent-lavender)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills Selection */}
              <div className="form-group">
                <label className="form-label">
                  Production Disciplines & Skills:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableSkills.map((s) => {
                    const isSelected = creatorForm.selectedSkills.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSkill(s.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.8125rem',
                          fontWeight: '600',
                          border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-medium)',
                          background: isSelected ? 'var(--text-primary)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }}
              >
                {loading ? (
                  <>
                    <ArrowsClockwise size={18} className="animate-spin" />
                    <span>Saving Studio Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Studio Setup</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form: BRAND */
            <form onSubmit={handleBrandSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="brand-company-name">
                    Company / Agency Name *
                  </label>
                  <input
                    id="brand-company-name"
                    type="text"
                    required
                    value={brandForm.company_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBrandForm({
                        ...brandForm,
                        company_name: val,
                        slug: val.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                      });
                    }}
                    placeholder="Aurora Cosmetics"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="brand-slug">
                    Company Slug *
                  </label>
                  <input
                    id="brand-slug"
                    type="text"
                    required
                    value={brandForm.slug}
                    onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                    placeholder="aurora-cosmetics"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="brand-industry">
                    Industry *
                  </label>
                  <input
                    id="brand-industry"
                    type="text"
                    required
                    value={brandForm.industry}
                    onChange={(e) => setBrandForm({ ...brandForm, industry: e.target.value })}
                    placeholder="Luxury Beauty & Skincare"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="brand-hq">
                    Headquarters *
                  </label>
                  <input
                    id="brand-hq"
                    type="text"
                    required
                    value={brandForm.headquarters}
                    onChange={(e) => setBrandForm({ ...brandForm, headquarters: e.target.value })}
                    placeholder="New York, USA"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="brand-size">
                    Company Size
                  </label>
                  <select
                    id="brand-size"
                    value={brandForm.company_size}
                    onChange={(e) => setBrandForm({ ...brandForm, company_size: e.target.value })}
                    className="form-select"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="10-50">10-50 employees</option>
                    <option value="50-200">50-200 employees</option>
                    <option value="200+">200+ enterprise</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="brand-website">
                    Website URL
                  </label>
                  <input
                    id="brand-website"
                    type="url"
                    value={brandForm.website_url}
                    onChange={(e) => setBrandForm({ ...brandForm, website_url: e.target.value })}
                    placeholder="https://aurora.com"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="brand-description">
                  Company Overview & Campaign Guidelines *
                </label>
                <textarea
                  id="brand-description"
                  required
                  rows={3}
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="Describe your brand identity, aesthetic standards, and target consumer demographics..."
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }}
              >
                {loading ? (
                  <>
                    <ArrowsClockwise size={18} className="animate-spin" />
                    <span>Saving Brand Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Brand Setup</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
