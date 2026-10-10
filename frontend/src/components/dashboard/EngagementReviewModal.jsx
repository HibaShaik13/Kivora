import React, { useState } from 'react';
import { X, Star, CheckCircle } from '@phosphor-icons/react';
import { engagementsApi } from '../../api/engagements';

export default function EngagementReviewModal({ isOpen, onClose, engagement, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5.0);
  const [review, setReview] = useState('');

  if (!isOpen || !engagement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) {
      setError('Please provide a written testimonial/review.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await engagementsApi.review(engagement.id, {
        rating: parseFloat(rating),
        review: review.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.message || 'Failed to submit engagement review.');
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
                backgroundColor: 'var(--accent-lavender-subtle)',
                color: 'var(--accent-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={20} weight="fill" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Complete Engagement & Review Creator
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Rate performance of @{engagement.creator_handle || 'creator'}
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

          {/* Star Rating */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
              Performance Rating (1.0 - 5.0)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: star <= rating ? '#E5A000' : 'var(--border-subtle)',
                    transition: 'transform var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Star size={32} weight={star <= rating ? 'fill' : 'regular'} />
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
              {rating.toFixed(1)} / 5.0 Stars
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Written Testimonial & Review *
            </label>
            <textarea
              className="input"
              rows={4}
              placeholder="Describe the creator's communication, aesthetic execution, prompt mastery, and turnaround time..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
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
              {loading ? 'Submitting...' : 'Complete & Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
