import React, { useState } from 'react';
import {
  Lightning,
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
      desc: 'Input a raw campaign concept. Kivora assists in generating technical generative specs: aspect ratios, resolution, duration, tools, and usage rights.',
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
      title: 'Manage milestones and licensing',
      desc: 'Review draft versions, request structured revisions, approve deliverables, and receive signed commercial buyout certificates.',
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
    <section style={{ padding: '100px 0', background: '#080A18', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw + 0.5rem, 3.25rem)',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              color: 'var(--text-primary)',
            }}
          >
            How production moves on Kivora.
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '54ch', margin: '0 auto', lineHeight: '1.6' }}>
            A transparent, deterministic production cycle from concept synthesis to commercial sign-off.
          </p>
        </div>

        {/* Dual-Track Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(16, 21, 48, 0.85)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <button
              onClick={() => setActiveTab('BRANDS')}
              style={{
                padding: '10px 26px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'BRANDS' ? '#A78BFA' : 'transparent',
                color: activeTab === 'BRANDS' ? '#060813' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              For Brands & Agencies
            </button>
            <button
              onClick={() => setActiveTab('CREATORS')}
              style={{
                padding: '10px 26px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'CREATORS' ? '#A78BFA' : 'transparent',
                color: activeTab === 'CREATORS' ? '#060813' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              For AI Creators & Studios
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {currentSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="card-editorial"
                style={{
                  background: 'linear-gradient(145deg, #101530 0%, #0a0e23 100%)',
                  padding: '36px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '24px',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                  boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '1.625rem',
                        fontWeight: '800',
                        color: 'var(--accent-gold)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {step.num}
                    </span>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(167, 139, 250, 0.12)',
                        border: '1px solid rgba(167, 139, 250, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#A78BFA',
                      }}
                    >
                      <Icon size={20} weight="bold" />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: '700' }}>
                    {step.title}
                  </h3>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
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


