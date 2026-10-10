import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightning,
  ArrowRight,
  CheckCircle,
  ArrowsClockwise,
  WarningCircle,
  UserCircle,
  Sparkle,
  Sliders,
  Cpu,
} from '@phosphor-icons/react';
import { aiApi } from '../../api/ai';

export default function AiBriefPlayground() {
  const [prompt, setPrompt] = useState(
    '30-second hyper-realistic cosmetic film showcasing hydrating mist spray with slow-motion fluid dynamics and glowing skin micro-shots for global social campaigns.'
  );
  const [loading, setLoading] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState(null);
  const [error, setError] = useState(null);

  const presets = [
    {
      label: 'Luxury Skincare',
      text: '30-second hyper-realistic cosmetic film showcasing hydrating mist spray with slow-motion fluid dynamics and glowing skin micro-shots for global social campaigns.',
    },
    {
      label: 'Electric Hypercar',
      text: 'Cinematic 4K teaser for a luxury electric hypercar drifting through a neon-lit rain-slicked metropolis with volumetric headlight reflections.',
    },
    {
      label: 'Haute Couture',
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
    <section style={{ padding: '100px 0', borderBottom: '1px solid var(--border-subtle)', background: '#080A18', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient Cosmic Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, rgba(10, 14, 35, 0.4) 60%, transparent 80%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-family-mono)',
                color: '#A78BFA',
                fontWeight: '600',
                letterSpacing: '0.04em',
              }}
            >
              <Sparkle weight="fill" size={12} />
              PRODUCTION WORKBENCH
            </span>
          </div>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw + 0.5rem, 3.25rem)',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}
          >
            From raw creative intent to production brief in seconds.
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '62ch', margin: '0 auto', lineHeight: '1.6' }}>
            Kivora's generative brief synthesizer automatically decomposes concepts into precise aspect ratios, technical generative tools, camera specifications, and licensing terms.
          </p>
        </div>

        {/* Workbench Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '28px',
            alignItems: 'start',
            maxWidth: '1120px',
            margin: '0 auto',
          }}
        >
          {/* Left / Main Interactive Console (7 Columns) */}
          <div
            className="glass-panel"
            style={{
              gridColumn: 'span 12',
              padding: '36px',
              borderRadius: '24px',
              background: 'linear-gradient(145deg, #101530 0%, #0a0e23 100%)',
              boxShadow: '0 24px 56px -12px rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
            }}
          >
            {/* Presets Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#A78BFA', fontFamily: 'var(--font-family-mono)', textTransform: 'uppercase' }}>
                Creative Presets:
              </span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(p.text);
                    setGeneratedBrief(null);
                  }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius-pill)',
                    background: prompt === p.text ? '#A78BFA' : 'rgba(255, 255, 255, 0.05)',
                    border: prompt === p.text ? '1px solid #A78BFA' : '1px solid var(--border-subtle)',
                    color: prompt === p.text ? '#060813' : 'var(--text-secondary)',
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

            {/* Input Form */}
            <form onSubmit={handleGenerate} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label htmlFor="brief-prompt-input" className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Campaign Creative Prompt</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family-mono)' }}>Natural Language Synthesis</span>
                </label>
                <textarea
                  id="brief-prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="form-textarea"
                  placeholder="Describe your generative campaign idea (e.g. 15s 9:16 vertical cinematic ad for luxury perfume with macro glass refractions)..."
                  style={{
                    resize: 'vertical',
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    background: 'rgba(6, 8, 19, 0.88)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    color: 'var(--text-primary)',
                    borderRadius: '14px',
                    padding: '16px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="btn btn-gold"
                    style={{
                      padding: '14px 28px',
                      fontSize: '0.9375rem',
                      fontWeight: '700',
                    }}
                  >
                    {loading ? (
                      <>
                        <ArrowsClockwise size={16} className="animate-spin" />
                        <span>Synthesizing Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Lightning weight="fill" size={16} />
                        <span>Synthesize Production Brief</span>
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
                  gap: '10px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'var(--status-error-bg)',
                  color: 'var(--status-error)',
                  border: '1px solid var(--status-error-border)',
                  fontSize: '0.875rem',
                  marginBottom: '24px',
                }}
              >
                <WarningCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Generated Specification Output */}
            {generatedBrief && (
              <div
                style={{
                  padding: '28px',
                  borderRadius: '18px',
                  background: 'rgba(6, 8, 19, 0.92)',
                  border: '1px solid rgba(230, 198, 135, 0.35)',
                  boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.8)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: 'var(--status-success)',
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                        marginBottom: '6px',
                      }}
                    >
                      <CheckCircle weight="fill" size={13} />
                      STRUCTURED SPECIFICATION READY
                    </span>
                    <h3 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: '600' }}>
                      {generatedBrief.title}
                    </h3>
                  </div>

                  <Link
                    to="/briefs/create"
                    state={{ initialBrief: generatedBrief }}
                    className="btn btn-gold"
                    style={{ padding: '10px 22px', fontSize: '0.875rem', fontWeight: '700' }}
                  >
                    <span>Publish as Live Brief</span>
                    <ArrowRight size={15} weight="bold" />
                  </Link>
                </div>

                {/* Parameter Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(16, 21, 48, 0.9)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                      Format & Aspect Ratio
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)', marginTop: '3px' }}>
                      {generatedBrief.aspect_ratio} • {generatedBrief.resolution_min || '4K UHD'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 21, 48, 0.9)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                      Estimated Budget
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--accent-gold)', marginTop: '3px' }}>
                      ${generatedBrief.suggested_budget?.toLocaleString() || '4,500'} USD
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 21, 48, 0.9)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                      Commercial Rights
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)', marginTop: '3px' }}>
                      {generatedBrief.usage_channels?.split(',')[0] || 'Worldwide Commercial Digital'}
                    </div>
                  </div>
                </div>

                {/* Objective & Recommended Tools */}
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.65' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Objective:</strong> {generatedBrief.campaign_objective}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)' }}>Suggested Tools:</span>
                    {(generatedBrief.recommended_tools || generatedBrief.suggested_tools || []).map((tl, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
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
      </div>
    </section>
  );
}

