import React, { useState } from 'react';
import { api } from '../services/api';

export default function SubmitDeliverableModal({ isOpen, onClose, engagement, onDeliverableSubmitted }) {
  const [title, setTitle] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !engagement) return null;

  const nextVersion = engagement.deliverables?.length ? engagement.deliverables.length + 1 : 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      title: title || `Draft Deliverable v${nextVersion}`,
      asset_url: assetUrl,
      notes: notes || 'Delivered asset package for campaign review.',
    };

    try {
      const updated = await api.submitDeliverable(engagement.id, payload);
      if (onDeliverableSubmitted) onDeliverableSubmitted(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit deliverable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel max-w-lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.96)), url(/assets/backgrounds/collaborations.jpg)',
          backgroundSize: 'cover',
        }}
      >
        <div className="modal-header">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              COLLABORATION MILESTONE
            </span>
            <h2 className="modal-title">Submit Deliverable v{nextVersion}</h2>
            <p className="text-xs text-neutral-500 mt-1">Campaign: {engagement.brief_title}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="banner-error mb-4" style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-form">Deliverable Title</label>
            <input
              type="text"
              className="input-text w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. Master Hero 4K Film (Draft v${nextVersion})`}
            />
          </div>

          <div>
            <label className="label-form">Master Asset URL / Storage Link *</label>
            <input
              type="text"
              className="input-text w-full font-mono text-xs"
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="/assets/portfolio/master_render.mp4 or https://..."
              required
            />
          </div>

          <div>
            <label className="label-form">Delivery Notes & Seeds</label>
            <textarea
              className="input-text w-full"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes on color grading, aspect ratio versions, audio sync, and workflow seeds attached."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Upload Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
