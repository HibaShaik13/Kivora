import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkle, FileText, ArrowLeft, Check, CurrencyDollar, CalendarBlank, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { briefsApi } from '../api/briefs';
import { aiApi } from '../api/ai';
import { taxonomyApi } from '../api/taxonomy';

export default function BriefCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Taxonomy options
  const [allSkills, setAllSkills] = useState([]);
  const [allTools, setAllTools] = useState([]);

  // AI Prompt Box
  const [aiPrompt, setAiPrompt] = useState('');

  // Brief Form Data
  const [formData, setFormData] = useState({
    title: '',
    campaign_objective: '',
    target_audience: '',
    content_type: 'VIDEO',
    creative_style_mood: 'Cinematic, Photorealistic, High Dynamic Range',
    aspect_ratio: '16:9',
    duration_seconds_min: 15,
    duration_seconds_max: 45,
    resolution_min: '4K',
    deliverables_description: '1x Master 4K video asset, raw project workflow parameters, and process screenshot verification.',
    revision_allowance: 2,
    budget_amount: 1500,
    budget_currency: 'USD',
    deadline_days: 14,
    required_skill_ids: [],
    required_tool_ids: [],
    commercial_use_requirements: 'Full commercial rights with perpetual digital streaming license.',
    usage_channels: 'Paid Social, YouTube, Web Landing Pages',
    usage_duration: 'Perpetual',
    usage_territories: 'Global',
    restrictions_and_guidelines: 'No third party copyright IP or unauthorized likenesses.',
    disclosure_requirements: 'AI generation disclosure in accordance with Kivora verification standards.',
    status: 'PUBLISHED',
  });

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [skills, tools] = await Promise.all([
          taxonomyApi.getSkills(),
          taxonomyApi.getTools(),
        ]);
        setAllSkills(skills || []);
        setAllTools(tools || []);
      } catch (err) {
        console.error('Failed to load taxonomy:', err);
      }
    };
    loadTaxonomy();
  }, []);

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiPrompt.length < 10) {
      setError('Please provide at least 10 characters describing your campaign concept.');
      return;
    }

    try {
      setAiGenerating(true);
      setError(null);

      const aiResult = await aiApi.generateBrief({
        raw_prompt: aiPrompt,
        brand_industry: 'Media & Technology',
        target_budget: formData.budget_amount,
      });

      // Populate form with AI generated fields
      setFormData((prev) => ({
        ...prev,
        title: aiResult.title || prev.title,
        campaign_objective: aiResult.campaign_objective || prev.campaign_objective,
        target_audience: aiResult.target_audience || prev.target_audience,
        content_type: aiResult.content_type || prev.content_type,
        creative_style_mood: aiResult.creative_style_mood || prev.creative_style_mood,
        aspect_ratio: aiResult.aspect_ratio || prev.aspect_ratio,
        duration_seconds_min: aiResult.duration_seconds_min || prev.duration_seconds_min,
        duration_seconds_max: aiResult.duration_seconds_max || prev.duration_seconds_max,
        resolution_min: aiResult.resolution_min || prev.resolution_min,
        deliverables_description: aiResult.deliverables_description || prev.deliverables_description,
        revision_allowance: aiResult.revision_allowance || prev.revision_allowance,
        budget_amount: aiResult.budget_amount || prev.budget_amount,
        commercial_use_requirements: aiResult.commercial_use_requirements || prev.commercial_use_requirements,
        usage_channels: aiResult.usage_channels || prev.usage_channels,
        usage_duration: aiResult.usage_duration || prev.usage_duration,
        usage_territories: aiResult.usage_territories || prev.usage_territories,
        restrictions_and_guidelines: aiResult.restrictions_and_guidelines || prev.restrictions_and_guidelines,
        disclosure_requirements: aiResult.disclosure_requirements || prev.disclosure_requirements,
      }));
    } catch (err) {
      console.error('AI brief generation failed:', err);
      setError(err.message || 'AI generation failed. You can continue authoring manually below.');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleSkill = (id) => {
    const list = formData.required_skill_ids;
    setFormData({
      ...formData,
      required_skill_ids: list.includes(id) ? list.filter(x => x !== id) : [...list, id],
    });
  };

  const toggleTool = (id) => {
    const list = formData.required_tool_ids;
    setFormData({
      ...formData,
      required_tool_ids: list.includes(id) ? list.filter(x => x !== id) : [...list, id],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.campaign_objective.trim()) {
      setError('Brief title and campaign objective are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        budget_amount: parseFloat(formData.budget_amount) || 1000,
        deadline_days: parseInt(formData.deadline_days, 10) || 14,
        revision_allowance: parseInt(formData.revision_allowance, 10) || 2,
        duration_seconds_min: parseInt(formData.duration_seconds_min, 10) || null,
        duration_seconds_max: parseInt(formData.duration_seconds_max, 10) || null,
      };

      await briefsApi.create(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/brand/dashboard');
      }, 1200);
    } catch (err) {
      console.error('Failed to create campaign brief:', err);
      setError(err.message || 'Failed to create brief. Please check fields and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-main)' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        {/* Navigation back */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/brand/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Brand Dashboard</span>
          </Link>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>AI CAMPAIGN AUTHORING</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Structured Creative Brief</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
            Create Campaign Brief
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Transform natural language creative ideas into structured generative briefs with precision criteria and explainable matching.
          </p>
        </div>

        {/* AI Brief Generator Accelerator Card */}
        <div
          className="card"
          style={{
            padding: '24px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1.5px solid var(--accent-lavender-border)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkle size={20} weight="fill" style={{ color: 'var(--accent-lavender)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontFamily: 'var(--font-family-display)', fontWeight: 700 }}>
              AI Brief Synthesizer
            </h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Describe your campaign concept in plain English and let Kivora automatically formulate technical constraints, aspect ratios, and model requirements.
          </p>

          <form onSubmit={handleAiGenerate}>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. We need a high-end 30-second futuristic perfume commercial featuring bioluminescent floral motion, cinematic macro closeups, and warm amber lighting for Instagram Reels and YouTube preroll..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '8px 18px', backgroundColor: 'var(--accent-lavender)', borderColor: 'var(--accent-lavender)' }}
                disabled={aiGenerating}
              >
                <Sparkle size={16} weight="fill" />
                <span>{aiGenerating ? 'Synthesizing Brief...' : 'Auto-Generate Structured Brief'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Main Brief Form */}
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            padding: '32px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {error && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'var(--accent-coral-subtle)',
                border: '1px solid var(--accent-coral-border)',
                borderRadius: '8px',
                color: 'var(--accent-coral)',
                fontSize: '0.875rem',
                marginBottom: '24px',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                border: '1px solid #2E7D32',
                borderRadius: '8px',
                color: '#2E7D32',
                fontSize: '0.875rem',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              <Check size={18} weight="bold" />
              <span>Campaign brief created successfully! Redirecting to dashboard...</span>
            </div>
          )}

          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.125rem', fontWeight: 700 }}>
            1. Campaign Essentials
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Brief Title *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Aethelgard: Generative Cyberpunk Teaser Campaign"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Campaign Objective & Vision *
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Detail your brand goals, target emotional impact, narrative tone, and core messaging..."
                value={formData.campaign_objective}
                onChange={(e) => setFormData({ ...formData, campaign_objective: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Target Audience
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Gen Z Digital Creators & Tech Early Adopters"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Creative Style & Mood
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Cinematic, Photorealistic, High Contrast"
                value={formData.creative_style_mood}
                onChange={(e) => setFormData({ ...formData, creative_style_mood: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Content Type
              </label>
              <select
                className="input"
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              >
                <option value="VIDEO">Video Production</option>
                <option value="IMAGE">Visual Imagery / Stills</option>
                <option value="3D_MODEL">3D & Spatial Assets</option>
                <option value="AUDIO">Audio & Voice Synthesis</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Aspect Ratio
              </label>
              <select
                className="input"
                value={formData.aspect_ratio}
                onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
              >
                <option value="16:9">16:9 (Landscape Cinematic / YouTube)</option>
                <option value="9:16">9:16 (Vertical Social / TikTok / Reels)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="2.39:1">2.39:1 (Anamorphic Cinema)</option>
              </select>
            </div>
          </div>

          <h3 style={{ margin: '28px 0 20px 0', fontSize: '1.125rem', fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            2. Budget, Deadlines & Deliverables
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Budget Amount ($ USD) *
              </label>
              <div style={{ position: 'relative' }}>
                <CurrencyDollar
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
                />
                <input
                  type="number"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  min={50}
                  value={formData.budget_amount}
                  onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Production Deadline (Days from Commission) *
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarBlank
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
                />
                <input
                  type="number"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  min={1}
                  max={90}
                  value={formData.deadline_days}
                  onChange={(e) => setFormData({ ...formData, deadline_days: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Included Revision Allowance
              </label>
              <input
                type="number"
                className="input"
                min={1}
                max={10}
                value={formData.revision_allowance}
                onChange={(e) => setFormData({ ...formData, revision_allowance: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Deliverables Package Description
              </label>
              <textarea
                className="input"
                rows={2}
                value={formData.deliverables_description}
                onChange={(e) => setFormData({ ...formData, deliverables_description: e.target.value })}
              />
            </div>
          </div>

          {/* Required Skills Taxonomy */}
          <h3 style={{ margin: '28px 0 16px 0', fontSize: '1.125rem', fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            3. Required Skills & Tooling Criteria
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
              Target Skills (Weight: 35%)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allSkills.map((sk) => {
                const isSelected = formData.required_skill_ids.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => toggleSkill(sk.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isSelected ? '1.5px solid var(--accent-lavender)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--accent-lavender-subtle)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--accent-lavender)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isSelected && <Check size={14} weight="bold" />}
                    <span>{sk.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
              Required AI Models & Production Tools (Weight: 25%)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allTools.map((tl) => {
                const isSelected = formData.required_tool_ids.includes(tl.id);
                return (
                  <button
                    key={tl.id}
                    type="button"
                    onClick={() => toggleTool(tl.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isSelected ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--accent-coral-subtle)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--accent-coral)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isSelected && <Check size={14} weight="bold" />}
                    <span>{tl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lifecycle Status Choice */}
          <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
              Initial Brief Publication Status
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={formData.status === 'PUBLISHED'}
                  onChange={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                />
                <strong>Publish Immediately</strong> (Visible to creators & matching engine)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={formData.status === 'DRAFT'}
                  onChange={() => setFormData({ ...formData, status: 'DRAFT' })}
                />
                <strong>Save as Draft</strong> (Private to your brand team)
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <Link to="/brand/dashboard" className="btn btn-ghost" disabled={loading}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FileText size={16} />
              <span>{loading ? 'Submitting Brief...' : formData.status === 'PUBLISHED' ? 'Publish Brief' : 'Save Draft'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
