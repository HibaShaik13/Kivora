import React, { useState } from 'react';
import { api } from '../services/api';

export default function ReviewEngagementModal({ isOpen, onClose, engagement, mode = 'revision', onUpdated }) {
  // mode: 'revision' | 'approve' | 'review'
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5.0);
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !engagement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let updated;
      if (mode === 'revision') {
        updated = await api.requestRevisions(engagement.id, { feedback });
      } else if (mode === 'approve') {
        updated = await api.approveDeliverable(engagement.id);
      } else if (mode === 'review') {
        updated = await api.reviewEngagement(engagement.id, {
          rating: parseFloat(rating),
          review,
        });
      }
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed.');
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
              {mode === 'revision'
                ? 'REQUEST REVISIONS'
                : mode === 'approve'
                ? 'FINAL APPROVAL'
                : 'COMMERCIAL REVIEW'}
            </span>
            <h2 className="modal-title">
              {mode === 'revision'
                ? 'Request Creative Changes'
                : mode === 'approve'
                ? 'Sign Off on Master Deliverable'
                : 'Rate Creator Performance'}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Creator: {engagement.creator_display_name}</p>
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
          {mode === 'revision' && (
            <div>
              <label className="label-form">Revision Feedback & Adjustments *</label>
              <textarea
                className="input-text w-full"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain the required modifications (e.g. adjust lighting saturation, slow down camera pan at 0:12, re-render frame 45)..."
                required
              />
            </div>
          )}

          {mode === 'approve' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
              <p className="font-semibold">Confirm Final Deliverable Sign-off</p>
              <p>
                Approving this deliverable acknowledges that all campaign milestones and technical requirements
                have been satisfied. The engagement status will transition to <strong>FINAL_APPROVED</strong>.
              </p>
            </div>
          )}

          {mode === 'review' && (
            <>
              <div>
                <label className="label-form">Creator Rating (1.0 - 5.0)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    className="w-full"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                  <span className="text-lg font-bold text-purple-700 w-12 text-right">
                    ★ {rating}
                  </span>
                </div>
              </div>

              <div>
                <label className="label-form">Written Creator Review</label>
                <textarea
                  className="input-text w-full"
                  rows={3}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience working with this creator on technical execution, turnaround speed, and aesthetic excellence."
                  required
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className={mode === 'approve' ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-primary'}
              disabled={isLoading}
            >
              {isLoading
                ? 'Processing...'
                : mode === 'revision'
                ? 'Send Revision Request'
                : mode === 'approve'
                ? 'Approve Master Asset'
                : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
