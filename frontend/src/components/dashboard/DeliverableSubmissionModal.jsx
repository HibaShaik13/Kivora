import React, { useState } from 'react';
import { X, UploadSimple, Sparkle, Link, FileText } from '@phosphor-icons/react';
import { engagementsApi } from '../../api/engagements';

export default function DeliverableSubmissionModal({ isOpen, onClose, engagement, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !engagement) return null;

  const currentVersion = engagement.deliverables?.length ? engagement.deliverables.length + 1 : 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetUrl.trim()) {
      setError('Deliverable asset URL is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: title.trim() || `Draft Deliverable v${currentVersion}`,
        asset_url: assetUrl.trim(),
        notes: notes.trim() || undefined,
      };

      await engagementsApi.submitDeliverable(engagement.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit deliverable:', err);
      setError(err.message || 'Failed to submit deliverable package.');
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
          maxWidth: '600px',
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
              <UploadSimple size={20} weight="bold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Submit Deliverable v{currentVersion}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Engagement: {engagement.brief_title || engagement.id}
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Deliverable Title
            </label>
            <input
              type="text"
              className="input"
              placeholder={`e.g. Rough Cut v${currentVersion} with Master Color Grade`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Master Asset / Cloud Review Link *
            </label>
            <div style={{ position: 'relative' }}>
              <Link
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
              />
              <input
                type="url"
                className="input"
                style={{ paddingLeft: '38px' }}
                placeholder="https://... (Frame.io, Google Drive, Vimeo, MP4 direct link)"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Production Notes & Changes
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Highlight adjustments made to pacing, resolution upscaling, or sound design sync..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {loading ? 'Submitting...' : `Submit Draft v${currentVersion}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
