import React, { useState, useEffect } from 'react';
import { X, Sparkle, ShieldCheck, CheckCircle, XCircle, WarningCircle, Eye, ArrowSquareOut } from '@phosphor-icons/react';
import { verificationApi } from '../../api/verification';

export default function AdminAuditModal({ isOpen, onClose, request, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const [aiAnalysis, setAiAnalysis] = useState(request?.ai_analysis || null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [decision, setDecision] = useState('APPROVED');

  useEffect(() => {
    if (request?.ai_analysis) {
      setAiAnalysis(request.ai_analysis);
    } else {
      setAiAnalysis(null);
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleRunAiAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const analysis = await verificationApi.triggerAiAnalysis(request.id);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('Failed to run AI verification analysis:', err);
      setError(err.message || 'Failed to generate Gemini AI evidence audit analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      setError('Please provide administrative audit notes for the creator record.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await verificationApi.reviewRequestAdmin(request.id, {
        status: decision,
        reviewer_notes: reviewNotes.trim(),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit verification review:', err);
      setError(err.message || 'Failed to record audit decision.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 23, 21, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-warm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-lavender-subtle)',
                color: 'var(--accent-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} weight="fill" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Audit Verification Request
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Creator: @{request.creator_handle || 'creator'} ({request.creator_name})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--accent-coral-subtle)',
                border: '1px solid var(--accent-coral-border)',
                borderRadius: '8px',
                color: 'var(--accent-coral)',
                fontSize: '0.875rem',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {/* Evidence Details */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span className="badge badge-coral" style={{ fontSize: '0.6875rem', marginBottom: '4px' }}>
                  {request.target_type}
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  {request.evidence_title || 'Evidence Record'}
                </h4>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Project: <strong>{request.project_title || request.target_id}</strong>
                </div>
              </div>
              <span className={`badge badge-${request.status === 'APPROVED' ? 'verified' : request.status === 'PENDING' ? 'coral' : 'neutral'}`}>
                {request.status}
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Claim Scope: {request.verification_scope}
            </div>

            {request.evidence_file_url && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <a
                  href={request.evidence_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  <Eye size={14} />
                  <span>Inspect Evidence File / Link</span>
                  <ArrowSquareOut size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Gemini AI Evidence Analysis Card */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkle size={18} weight="fill" style={{ color: 'var(--accent-lavender)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Gemini AI Evidence Analysis
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing Pipeline...' : aiAnalysis ? 'Re-run Analysis' : 'Run Gemini Analysis'}
              </button>
            </div>

            {aiAnalysis ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0 0 10px 0', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {aiAnalysis.summary}
                </p>

                {aiAnalysis.evidence_items_detected?.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#2E7D32' }}>Detected Evidence:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                      {aiAnalysis.evidence_items_detected.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.potential_inconsistencies?.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--accent-coral)' }}>Inconsistencies / Flags:</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', color: 'var(--accent-coral)' }}>
                      {aiAnalysis.potential_inconsistencies.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                  Model: {aiAnalysis.model_name} • {aiAnalysis.disclaimer}
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                No AI evidence analysis generated yet. Click "Run Gemini Analysis" to inspect prompt syntax, parameter consistency, and artifact validation.
              </p>
            )}
          </div>

          {/* Admin Decision Form */}
          <form onSubmit={handleSubmitReview}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                Audit Decision *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDecision('APPROVED')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: decision === 'APPROVED' ? '2px solid #2E7D32' : '1px solid var(--border-subtle)',
                    backgroundColor: decision === 'APPROVED' ? 'rgba(46, 125, 50, 0.08)' : 'var(--bg-subtle)',
                    color: decision === 'APPROVED' ? '#2E7D32' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={18} weight="fill" />
                  <span>Approve Claim</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REJECTED')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: decision === 'REJECTED' ? '2px solid var(--accent-coral)' : '1px solid var(--border-subtle)',
                    backgroundColor: decision === 'REJECTED' ? 'var(--accent-coral-subtle)' : 'var(--bg-subtle)',
                    color: decision === 'REJECTED' ? 'var(--accent-coral)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <XCircle size={18} weight="fill" />
                  <span>Reject Claim</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Reviewer Audit Notes *
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Detailed rationale for approval or specific evidence missing for rejection..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                required
              />
            </div>

            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Recording Decision...' : `Submit ${decision}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
