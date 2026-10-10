import React, { useState, useEffect } from 'react';
import { matchingService } from '../services/matchingService';
import { briefService } from '../services/briefService';

export default function BriefDetailModal({ brief, onClose, onSelectCreator, currentUser }) {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [pitchText, setPitchText] = useState('');
  const [proposedRate, setProposedRate] = useState(brief?.budget_amount || 3500);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [submittingApply, setSubmittingApply] = useState(false);

  useEffect(() => {
    if (!brief?.id) return;
    async function loadMatches() {
      try {
        setLoadingMatches(true);
        const data = await matchingService.getBriefMatches(brief.id);
        setMatches(data?.matches || []);
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    }
    loadMatches();
  }, [brief?.id]);

  if (!brief) return null;

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      setSubmittingApply(true);
      setApplyError(null);
      await briefService.applyToBrief(brief.id, {
        pitch_text: pitchText || 'I am ready to deliver 4K cinematic deliverables matching your brand guidelines.',
        proposed_rate: parseFloat(proposedRate),
        proposed_timeline_days: 14,
        attached_project_ids: [],
      });
      setApplySuccess(true);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container brief-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`badge badge-${brief.content_type?.toLowerCase() || 'video'}`}>
              {brief.content_type}
            </span>
            <span className="badge-format-tag">{brief.aspect_ratio} • {brief.resolution_min}</span>
            <h2 className="modal-title">{brief.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="brief-modal-content-grid">
          {/* Left: Brief Specifications */}
          <div className="brief-spec-col">
            <div className="budget-highlight-card glass-panel">
              <div className="budget-meta">
                <span className="budget-label">CAMPAIGN BUDGET</span>
                <span className="budget-amount">${brief.budget_amount?.toLocaleString()} {brief.budget_currency || 'USD'}</span>
              </div>
              <div className="budget-brand">
                <span className="brand-label">BRAND</span>
                <span className="brand-name">{brief.brand?.company_name || 'Lumina Skincare'}</span>
              </div>
            </div>

            <div className="spec-section">
              <h4>CAMPAIGN OBJECTIVE</h4>
              <p>{brief.campaign_objective}</p>
            </div>

            <div className="spec-section">
              <h4>TARGET AUDIENCE & MOOD</h4>
              <p><strong>Audience:</strong> {brief.target_audience}</p>
              <p><strong>Style & Mood:</strong> {brief.creative_style_mood}</p>
            </div>

            <div className="spec-section">
              <h4>DELIVERABLES & USAGE RIGHTS</h4>
              <p>{brief.deliverables_description}</p>
              <div className="rights-badge-row">
                <span className="tag-pill">Duration: {brief.duration_seconds_min || 15}-{brief.duration_seconds_max || 30}s</span>
                <span className="tag-pill">Revisions: {brief.revision_allowance || 2}</span>
                <span className="tag-pill text-emerald">Commercial: {brief.commercial_use_requirements || 'Full Commercial Buyout'}</span>
              </div>
            </div>

            {/* Creator Application Form if logged in as CREATOR */}
            <div className="application-section glass-panel">
              <h4>SUBMIT APPLICATION PITCH</h4>
              {applySuccess ? (
                <div className="alert-success">
                  ✓ Application successfully submitted to brand! Engagement pending review.
                </div>
              ) : (
                <form onSubmit={handleApply} className="apply-form">
                  <textarea
                    rows={3}
                    placeholder="Explain your creative approach, tools (Runway/ComfyUI), and portfolio relevance..."
                    value={pitchText}
                    onChange={(e) => setPitchText(e.target.value)}
                    className="apply-textarea"
                    required
                  />
                  <div className="apply-form-footer">
                    <div className="rate-input-group">
                      <label>Proposed Rate ($):</label>
                      <input
                        type="number"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        className="rate-input"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingApply}>
                      {submittingApply ? 'Submitting...' : 'Submit Pitch →'}
                    </button>
                  </div>
                  {applyError && <p className="text-red text-sm mt-1">{applyError}</p>}
                </form>
              )}
            </div>
          </div>

          {/* Right: Proof-to-Brief Matching Engine */}
          <div className="brief-matching-col">
            <div className="matching-header-box">
              <div className="matching-header-title">
                <span className="spark-icon">⚡</span>
                <h3>Proof-to-Brief Matching Engine</h3>
              </div>
              <p className="matching-header-sub">
                Explainable ranking based on audited video projects, tool mastery, and commercial license requirements.
              </p>
            </div>

            {loadingMatches ? (
              <div className="loading-state-box glass-panel">
                <div className="spinner-ring" />
                <p>Computing match scores against creator portfolio evidence...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="empty-state-box glass-panel">
                <p>No matching creators found above the compatibility threshold.</p>
              </div>
            ) : (
              <div className="matches-list">
                {matches.slice(0, 4).map((m, idx) => (
                  <div key={m.creator_id || idx} className="match-card glass-panel">
                    <div className="match-card-top">
                      <img
                        src={m.avatar_url || '/assets/avatars/elena.jpg'}
                        alt={m.display_name}
                        className="match-avatar"
                        style={{
                          width: '48px',
                          height: '48px',
                          minWidth: '48px',
                          maxWidth: '48px',
                          minHeight: '48px',
                          maxHeight: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '2px solid rgba(121, 82, 236, 0.3)',
                        }}
                      />
                      <div className="match-meta">
                        <div className="match-name-row">
                          <strong>{m.display_name}</strong>
                          <span className="badge badge-top-studio">{m.verification_tier}</span>
                        </div>
                        <span className="match-handle">@{m.handle} • ${m.min_budget}/brief</span>
                      </div>
                      <div className="match-score-badge">
                        <span className="score-num">{m.score.toFixed(1)}%</span>
                        <span className="score-lbl">{m.match_level}</span>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="match-reasons-list">
                      {m.reasons && m.reasons.map((r, rIdx) => (
                        <div key={rIdx} className="match-reason-item">
                          <span className="reason-check">✓</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Matched Tools */}
                    <div className="match-tools-strip">
                      {m.matched_tools && m.matched_tools.map((t) => (
                        <span key={t} className="tag-pill match-tool-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
