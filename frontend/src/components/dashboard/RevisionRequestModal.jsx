import React, { useState } from 'react';
import { X, ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react';
import { engagementsApi } from '../../api/engagements';

export default function RevisionRequestModal({ isOpen, onClose, engagement, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');

  if (!isOpen || !engagement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError('Please provide specific, actionable revision feedback for the creator.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await engagementsApi.requestRevisions(engagement.id, { feedback: feedback.trim() });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to request revisions:', err);
      setError(err.message || 'Failed to submit revision request.');
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
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-warm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-coral-subtle)',
                color: 'var(--accent-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowCounterClockwise size={20} weight="bold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Request Deliverable Revisions
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Creator: @{engagement.creator_handle || 'creator'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Actionable Feedback & Change Items *
            </label>
            <textarea
              className="input"
              rows={4}
              placeholder="e.g. Please adjust the lighting transition at 0:14, remove prompt artifacts around the logo typography, and align aspect ratio to 16:9 cinematic."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
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
              {loading ? 'Submitting...' : 'Send Revision Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
