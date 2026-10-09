import React from 'react';
import {
  ShieldCheck,
  Graph,
  Sliders,
  CheckCircle,
  FileLock,
  Sparkle,
} from '@phosphor-icons/react';

export default function VerificationDifferentiator() {
  const pillars = [
    {
      icon: Graph,
      title: 'Verifiable Workflow Proof',
      tag: 'Anti-Prompt Faker',
      description:
        'Anyone can generate a lucky single frame. Kivora requires creators to document step-by-step production pipelines, ComfyUI node graphs, LoRA checkpoints, and raw parameter logs.',
      color: 'var(--accent-lavender)',
      bg: 'var(--accent-lavender-subtle)',
      border: 'var(--accent-lavender-border)',
    },
    {
      icon: Sliders,
      title: 'Explainable Matching Engine',
      tag: 'Deterministic Fit',
      description:
        'Our algorithm evaluates hard compatibility (content format, aspect ratio, budget limits) alongside weighted scores across declared models, verified claims, and stylistic consistency.',
      color: 'var(--accent-coral)',
      bg: 'var(--accent-coral-subtle)',
      border: 'var(--accent-coral-border)',
    },
    {
      icon: FileLock,
      title: 'Commercial IP Rights Framework',
      tag: 'Legal Protection',
      description:
        'Every brief includes explicit commercial licensing specifications: channel distribution, territories, exclusivity durations, and AI model disclosure warranties.',
      color: 'var(--status-success)',
      bg: 'var(--status-success-bg)',
      border: 'var(--status-success-border)',
    },
  ];

  return (
    <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-neutral">
              <ShieldCheck weight="fill" size={13} style={{ color: 'var(--accent-lavender)' }} />
              The Kivora Standard
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
            Built for enterprise-grade generative production.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '58ch', margin: '0 auto' }}>
            Traditional freelance platforms evaluate human-hour rates. Kivora solves the trust and discovery bottleneck in generative creative production.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="card-editorial"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '32px 28px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: p.bg,
                        border: `1px solid ${p.border}`,
                        color: p.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={24} weight="duotone" />
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: p.bg,
                        color: p.color,
                        border: `1px solid ${p.border}`,
                        fontSize: '0.6875rem',
                      }}
                    >
                      {p.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    {p.title}
                  </h3>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
