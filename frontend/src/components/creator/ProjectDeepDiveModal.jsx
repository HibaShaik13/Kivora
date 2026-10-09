import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  VideoCamera,
  Image as ImageIcon,
  Cube,
  Copy,
  Check,
  Clock,
  Sparkle,
  FileCode,
  FileLock,
  ArrowSquareOut,
  WarningCircle,
} from '@phosphor-icons/react';
import { getMediaUrl } from '../../api/client';

export default function ProjectDeepDiveModal({ project, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('WORKFLOW'); // 'WORKFLOW' | 'EVIDENCE'
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const workflowSteps = project.workflow_steps || [];
  const evidenceRecords = project.evidence_records || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(26, 23, 21, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 200ms ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="card-editorial"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-medium)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <X size={18} weight="bold" />
        </button>

        {/* Header Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span className="badge badge-verified">
            <Sparkle weight="fill" size={12} />
            Verified Creative Deep-Dive
          </span>
          <span className="badge badge-neutral">
            {project.content_type} • {project.aspect_ratio} • {project.resolution || '4K UHD'}
          </span>
          {project.commercial_rights_held && (
            <span className="badge badge-success">
              <CheckCircle weight="fill" size={12} />
              {project.commercial_license_type || 'Full Commercial Buyout'}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h2 style={{ fontSize: '1.625rem', letterSpacing: '-0.03em', marginBottom: '10px', color: 'var(--text-primary)', paddingRight: '40px' }}>
          {project.title}
        </h2>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          {project.description}
        </p>

        {/* Primary Asset Media Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1A1715 0%, #2A2522 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ textAlign: 'center', color: '#FAF8F5', padding: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-family-mono)',
                marginBottom: '12px',
              }}
            >
              <VideoCamera size={16} />
              <span>Master Asset Stream • {project.resolution || '4K UHD'}</span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '4px' }}>
              {project.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(250, 248, 245, 0.7)' }}>
              Provenance Verified • {workflowSteps.length} Production Stages • {evidenceRecords.length} Audited Proof Items
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={() => setActiveTab('WORKFLOW')}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: activeTab === 'WORKFLOW' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: activeTab === 'WORKFLOW' ? '2px solid var(--accent-lavender)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={16} />
            <span>Sequential Workflow Pipeline ({workflowSteps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EVIDENCE')}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: activeTab === 'EVIDENCE' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: activeTab === 'EVIDENCE' ? '2px solid var(--accent-lavender)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={16} />
            <span>Audit & Verification Proof ({evidenceRecords.length})</span>
          </button>
        </div>

        {/* Tab 1: Workflow Pipeline Timeline */}
        {activeTab === 'WORKFLOW' && (
          <div>
            {workflowSteps.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                No workflow steps documented for this project.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {workflowSteps
                  .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
                  .map((step, idx) => (
                    <div
                      key={step.id || idx}
                      style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {/* Step Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--accent-lavender)',
                              color: '#FFFFFF',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-family-mono)',
                            }}
                          >
                            {step.step_order || idx + 1}
                          </span>
                          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {step.stage_name}
                          </h4>
                        </div>

                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          {step.tools_used}
                        </span>
                      </div>

                      {/* Step Description */}
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: step.parameters_snippet ? '14px' : '0' }}>
                        {step.description}
                      </p>

                      {/* Generation Parameters Snippet */}
                      {step.parameters_snippet && (
                        <div
                          style={{
                            background: '#1A1715',
                            color: '#E6E1DC',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            position: 'relative',
                            overflowX: 'auto',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', color: '#8C847E', fontSize: '0.6875rem' }}>
                            <span>GENERATIVE PARAMETERS & SEED LOG</span>
                            <button
                              onClick={() => handleCopy(step.parameters_snippet, step.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: copiedSnippet === step.id ? '#10B981' : '#8C847E',
                                cursor: 'pointer',
                                fontSize: '0.6875rem',
                              }}
                            >
                              {copiedSnippet === step.id ? <Check size={13} /> : <Copy size={13} />}
                              <span>{copiedSnippet === step.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <code>{step.parameters_snippet}</code>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Evidence & Audit Proof */}
        {activeTab === 'EVIDENCE' && (
          <div>
            {evidenceRecords.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                No verification evidence attached to this project.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {evidenceRecords.map((ev) => {
                  const ver = ev.verification;
                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                            {ev.evidence_type}
                          </span>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {ev.title}
                          </h4>
                        </div>

                        {ver && (
                          <span
                            className={`badge ${
                              ver.status === 'APPROVED'
                                ? 'badge-success'
                                : ver.status === 'PENDING'
                                ? 'badge-neutral'
                                : 'badge-coral'
                            }`}
                            style={{ fontSize: '0.6875rem' }}
                          >
                            <ShieldCheck weight="fill" size={13} />
                            {ver.status}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                        {ev.description}
                      </p>

                      {/* Auditor Verdict if available */}
                      {ver && ver.reviewer_notes && (
                        <div
                          style={{
                            background: 'var(--status-success-bg)',
                            border: '1px solid var(--status-success-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 14px',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                            marginBottom: '10px',
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--status-success)', marginBottom: '2px' }}>
                            Auditor Notes ({ver.reviewed_by || 'Kivora Curator'}):
                          </div>
                          <div>{ver.reviewer_notes}</div>
                        </div>
                      )}

                      {/* Evidence File URL link */}
                      {ev.file_url && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <a
                            href={getMediaUrl(ev.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                          >
                            <span>Inspect Source File</span>
                            <ArrowSquareOut size={13} />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Commercial Rights Summary */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <FileLock size={18} style={{ color: 'var(--status-success)' }} />
            <span>Commercial Rights: <strong>{project.commercial_license_type || 'Full Commercial Buyout'}</strong></span>
          </div>

          <button onClick={onClose} className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
            Close Deep-Dive
          </button>
        </div>
      </div>
    </div>
  );
}
