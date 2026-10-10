import React from 'react';
import {
  Graph,
  Sliders,
  FileLock,
  Sparkle,
  ShieldCheck,
} from '@phosphor-icons/react';

export default function VerificationDifferentiator() {
  const pillars = [
    {
      icon: Graph,
      title: 'Verifiable Workflow Proof',
      tag: 'Pipeline Audit',
      badgeColor: '#A78BFA',
      description:
        'Kivora creators document step-by-step production pipelines: ComfyUI node graphs, LoRA checkpoints, ControlNet passes, and raw parameter logs.',
    },
    {
      icon: Sliders,
      title: 'Explainable Matching Engine',
      tag: 'Deterministic Fit',
      badgeColor: 'var(--accent-gold)',
      description:
        'Our algorithm evaluates hard compatibility (content format, aspect ratio, budget range) alongside verified tool claims and stylistic consistency.',
    },
    {
      icon: FileLock,
      title: 'Commercial Licensing Framework',
      tag: 'Clear Terms',
      badgeColor: '#A78BFA',
      description:
        'Every brief specifies explicit commercial rights: channel distribution, territories, exclusivity windows, and AI model disclosure.',
    },
  ];

  return (
    <section style={{ padding: '100px 0', background: '#060813', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(167, 139, 250, 0.1)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              marginBottom: '18px',
            }}
          >
            <Sparkle weight="fill" size={13} style={{ color: '#A78BFA' }} />
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#A78BFA',
                letterSpacing: '0.04em',
              }}
            >
              PRODUCTION STANDARDS
            </span>
          </div>

          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw + 0.5rem, 3.25rem)',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}
          >
            Built for enterprise generative production.
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '58ch', margin: '0 auto', lineHeight: '1.6' }}>
            Structured workflows, transparent model specifications, and verifiable delivery milestones.
          </p>
        </div>

        {/* 3 Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="card-editorial"
                style={{
                  background: 'linear-gradient(145deg, #101530 0%, #0a0e23 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '36px 30px',
                  borderRadius: '24px',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                  boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(167, 139, 250, 0.12)',
                        border: '1px solid rgba(167, 139, 250, 0.25)',
                        color: p.badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={24} weight="bold" />
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: '600',
                      }}
                    >
                      {p.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-primary)', fontWeight: '700' }}>
                    {p.title}
                  </h3>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
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


