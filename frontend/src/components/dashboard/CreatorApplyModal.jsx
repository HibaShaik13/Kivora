import React, { useState } from 'react';
import { X, PaperPlaneTilt, CurrencyDollar, CalendarBlank, Sparkle, Check } from '@phosphor-icons/react';
import { briefsApi } from '../../api/briefs';

export default function CreatorApplyModal({ isOpen, onClose, brief, creatorProjects = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pitchText, setPitchText] = useState('');
  const [proposedRate, setProposedRate] = useState(brief?.budget_amount || 500);
  const [proposedTimelineDays, setProposedTimelineDays] = useState(7);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  if (!isOpen || !brief) return null;

  const toggleProject = (id) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter(pId => pId !== id));
    } else {
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pitchText.trim()) {
      setError('Please provide a pitch or creative treatment summary.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        brief_id: brief.id,
        pitch_text: pitchText,
        proposed_rate: parseFloat(proposedRate) || brief.budget_amount,
        proposed_timeline_days: parseInt(proposedTimelineDays, 10) || 7,
        attached_project_ids: selectedProjectIds,
      };

      await briefsApi.apply(brief.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit application:', err);
      setError(err.message || 'Failed to submit application. Please retry.');
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
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>
                {brief.content_type || 'CAMPAIGN BRIEF'}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                Budget: ${brief.budget_amount?.toLocaleString()} {brief.budget_currency}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
              Apply to: {brief.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
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

          {/* Pitch Text */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Creative Pitch & Execution Approach *
            </label>
            <textarea
              className="input"
              rows={4}
              placeholder="Outline your generative workflow, camera motion aesthetic, model architecture, and timeline for this campaign..."
              value={pitchText}
              onChange={(e) => setPitchText(e.target.value)}
              required
            />
          </div>

          {/* Proposed Rates & Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Proposed Total Rate ($ USD) *
              </label>
              <div style={{ position: 'relative' }}>
                <CurrencyDollar
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
                />
                <input
                  type="number"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  min={50}
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Production Timeline (Days) *
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarBlank
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
                />
                <input
                  type="number"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  min={1}
                  max={60}
                  value={proposedTimelineDays}
                  onChange={(e) => setProposedTimelineDays(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Attach Portfolio Projects */}
          {creatorProjects && creatorProjects.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                Attach Relevant Evidence / Portfolio Work
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {creatorProjects.map((p) => {
                  const isSelected = selectedProjectIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid var(--accent-lavender)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--accent-lavender-subtle)' : 'var(--bg-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {p.content_type} • {p.aspect_ratio}
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-lavender)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={12} weight="bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
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
              <PaperPlaneTilt size={16} />
              <span>{loading ? 'Submitting Pitch...' : 'Send Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
