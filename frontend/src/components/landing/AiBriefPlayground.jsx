import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkle,
  Lightning,
  ArrowRight,
  CheckCircle,
  ArrowsClockwise,
  WarningCircle,
  UserCircle,
} from '@phosphor-icons/react';
import { aiApi } from '../../api/ai';

export default function AiBriefPlayground() {
  const [prompt, setPrompt] = useState(
    '30-second hyper-realistic cosmetic ad showcasing hydrating mist spray with slow-motion fluid dynamics and glowing skin micro-shots for TikTok & Instagram Reels.'
  );
  const [loading, setLoading] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState(null);
  const [error, setError] = useState(null);

  const presets = [
    {
      label: '✨ Luxury Skincare',
      text: '30-second hyper-realistic cosmetic ad showcasing hydrating mist spray with slow-motion fluid dynamics and glowing skin micro-shots for TikTok & Instagram Reels.',
    },
    {
      label: '⚡ Electric Hypercar',
      text: 'Cinematic 4K teaser for a luxury electric hypercar drifting through a neon-lit rain-slicked metropolis with volumetric headlight reflections.',
    },
    {
      label: '👗 Haute Couture',
      text: 'Surreal digital fashion film showcasing iridescent fluid silk drapery metamorphosing in zero gravity for a Paris Fashion Week digital installation.',
    },
  ];

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiApi.generateBrief({
        raw_prompt: prompt,
        brand_name: 'Studio Sandbox',
        target_budget: 4500,
      });
      setGeneratedBrief(result);
    } catch (err) {
      console.error('AI brief generation error:', err);
      setError(err.message || 'Could not generate brief. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-verified">
              <Sparkle weight="fill" size={13} />
              AI Production Assistant
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            From rough concept to production-ready brief in seconds.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '58ch', margin: '0 auto' }}>
            Try Kivora’s generative brief synthesizer. It automatically decomposes creative intent into aspect ratios, tools, camera descriptors, and commercial licensing tags.
          </p>
        </div>

        {/* Interactive Dual-Panel Box */}
        <div
          className="glass-panel"
          style={{
            padding: '32px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-tertiary)' }}>Presets:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(p.text);
                  setGeneratedBrief(null);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: prompt === p.text ? 'var(--accent-lavender-subtle)' : 'var(--bg-secondary)',
                  border: prompt === p.text ? '1px solid var(--accent-lavender-border)' : '1px solid var(--border-subtle)',
                  color: prompt === p.text ? 'var(--accent-lavender)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Form Input + Action */}
          <form onSubmit={handleGenerate} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="form-textarea"
                placeholder="Describe your generative campaign idea (e.g. 15s 9:16 vertical cinematic ad for luxury perfume with macro glass refractions)..."
                style={{
                  resize: 'vertical',
                  fontSize: '0.9375rem',
                  lineHeight: '1.5',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="btn btn-accent"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.875rem',
                  }}
                >
                  {loading ? (
                    <>
                      <ArrowsClockwise size={16} className="animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Lightning weight="fill" size={16} />
                      <span>Generate Production Brief</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Error Notice */}
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
                marginBottom: '20px',
              }}
            >
              <WarningCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Structured Brief Output */}
          {generatedBrief && (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                    <CheckCircle weight="fill" size={13} />
                    Structured Specification Ready
                  </span>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    {generatedBrief.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link
                    to="/briefs/create"
                    state={{ initialBrief: generatedBrief }}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
                  >
                    <span>Publish as Live Brief</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Parameter Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                    Format & Aspect Ratio
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {generatedBrief.aspect_ratio} • {generatedBrief.resolution_min || '4K UHD'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                    Suggested Budget
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--accent-lavender)', marginTop: '2px' }}>
                    ${generatedBrief.suggested_budget?.toLocaleString() || '4,500'} USD
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                    Commercial Rights
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {generatedBrief.usage_channels?.split(',')[0] || 'Worldwide Paid Social'}
                  </div>
                </div>
              </div>

              {/* Objective & Recommended Tools */}
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                <strong>Objective:</strong> {generatedBrief.campaign_objective}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)' }}>Suggested Tools:</span>
                  {(generatedBrief.recommended_tools || generatedBrief.suggested_tools || []).map((tl, i) => (
                    <span key={i} className="badge badge-neutral" style={{ fontSize: '0.6875rem', background: 'var(--bg-surface)' }}>
                      {tl}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCircle size={14} />
                  <span>Publishing requires an authorized Brand account</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
