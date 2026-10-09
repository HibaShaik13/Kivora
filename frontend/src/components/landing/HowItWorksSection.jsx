import React, { useState } from 'react';
import {
  Lightning,
  Sparkle,
  Compass,
  CheckCircle,
  FileText,
  ShieldCheck,
  Package,
} from '@phosphor-icons/react';

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState('BRANDS');

  const brandSteps = [
    {
      num: '01',
      title: 'Synthesize your brief with AI',
      desc: 'Input a raw campaign concept. Kivora’s assistant generates technical generative specs: aspect ratios, resolution, duration, tools, and usage rights.',
      icon: Lightning,
    },
    {
      num: '02',
      title: 'Inspect explainable creator matches',
      desc: 'Review creators ranked by proven model mastery, ComfyUI node graph evidence, and historical delivery ratings.',
      icon: Compass,
    },
    {
      num: '03',
      title: 'Manage milestones & commercial rights',
      desc: 'Review draft versions, request structured revisions, approve master 4K deliverables, and receive signed commercial buyout certificates.',
      icon: Package,
    },
  ];

  const creatorSteps = [
    {
      num: '01',
      title: 'Document multi-step pipelines',
      desc: 'Upload portfolio projects detailing specific workflow steps: concept synthesis, ControlNet passes, camera motion, and 4K upscaling.',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Earn evidence verification badges',
      desc: 'Submit intermediate render frames and node graphs. Advance from Community to Verified Pro and Top Studio tiers.',
      icon: ShieldCheck,
    },
    {
      num: '03',
      title: 'Receive high-value campaign briefs',
      desc: 'Submit tailored pitches for verified brand campaigns with clear budgets, explicit usage parameters, and milestone payouts.',
      icon: CheckCircle,
    },
  ];

  const currentSteps = activeTab === 'BRANDS' ? brandSteps : creatorSteps;

  return (
    <section style={{ padding: '80px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-neutral">
              <Sparkle weight="fill" size={13} style={{ color: 'var(--accent-coral)' }} />
              Workflow Architecture
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            How production moves on Kivora.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '52ch', margin: '0 auto' }}>
            A transparent, deterministic production cycle from concept synthesis to commercial sign-off.
          </p>
        </div>

        {/* Dual-Track Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <button
              onClick={() => setActiveTab('BRANDS')}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: '700',
                background: activeTab === 'BRANDS' ? 'var(--text-primary)' : 'transparent',
                color: activeTab === 'BRANDS' ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              For Brands & Agencies
            </button>
            <button
              onClick={() => setActiveTab('CREATORS')}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: '700',
                background: activeTab === 'CREATORS' ? 'var(--text-primary)' : 'transparent',
                color: activeTab === 'CREATORS' ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              For AI Creators & Studios
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {currentSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="card-editorial"
                style={{
                  background: 'var(--bg-surface)',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: 'var(--accent-lavender)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {step.num}
                    </span>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Icon size={18} weight="duotone" />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.125rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {step.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {step.desc}
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
