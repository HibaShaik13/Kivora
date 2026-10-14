import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getBriefCoverImage } from '../utils/visualAssetHelpers';
import BrandLogo from './BrandLogo';

export default function BriefCard({
  brief,
  index,
  onSelectBrief,
  isSaved: initialSaved,
  onToggleSave,
}) {
  const [isSaved, setIsSaved] = useState(Boolean(initialSaved));
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (initialSaved !== undefined) {
      setIsSaved(Boolean(initialSaved));
    } else if (currentUser && currentUser.role === 'CREATOR' && brief?.id) {
      api.getBriefSavedStatus(brief.id)
        .then((res) => setIsSaved(Boolean(res?.is_saved)))
        .catch(() => null);
    }
  }, [brief?.id, currentUser?.id, initialSaved]);

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!currentUser || currentUser.role !== 'CREATOR') {
      alert('Sign in as a Creator to save briefs to your bookmarks.');
      return;
    }
    if (isSaving || !brief?.id) return;

    const prevSaved = isSaved;
    const nextSaved = !prevSaved;
    setIsSaved(nextSaved);
    setIsSaving(true);

    try {
      if (prevSaved) {
        await api.unsaveBrief(brief.id);
      } else {
        await api.saveBrief(brief.id);
      }
      if (onToggleSave) {
        onToggleSave(brief.id, nextSaved, brief);
      }
    } catch (err) {
      setIsSaved(prevSaved);
      console.error('Error toggling brief bookmark:', err);
      alert(err.message || 'Failed to update bookmark. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const daysLeft = brief.deadline
    ? Math.ceil((new Date(brief.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 14;

  const isUrgent = daysLeft > 0 && daysLeft <= 5;

  const thumbnail = getBriefCoverImage(brief, index);

  const primaryCategoryName =
    brief.categories?.[0]?.name ||
    brief.content_type?.replace(/_/g, ' ') ||
    'Campaign Brief';

  const brandName = brief.brand?.company_name || 'Verified Luxury Brand';

  return (
    <div
      className="kivora-brief-card"
      onClick={() => onSelectBrief?.(brief)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectBrief?.(brief);
        }
      }}
    >
      {/* Top Cover Media Section */}
      <div className="brief-card-media-wrap">
        <img
          src={thumbnail}
          alt={brief.title}
          className="brief-card-cover-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/campaign-covers/brand_skincare_cover.jpg';
          }}
        />

        {/* Top Badges */}
        <div className="brief-card-overlay-top">
          <span className="brief-category-pill">{primaryCategoryName}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isUrgent ? (
              <span className="brief-urgent-pill">🔥 {daysLeft}d left</span>
            ) : (
              <span className="brief-status-pill">Active</span>
            )}

            {/* Save / Bookmark Button */}
            <button
              type="button"
              className="brief-card-save-btn"
              onClick={handleToggleSave}
              disabled={isSaving}
              title={isSaved ? 'Remove from saved briefs' : 'Save brief'}
              aria-label="Save brief to bookmarks"
              style={{
                background: isSaved ? '#7952EC' : 'rgba(0, 0, 0, 0.45)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSaving ? 'wait' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isSaved ? '#FFFFFF' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Format Pill */}
        <div className="brief-card-overlay-bottom">
          <span className="brief-format-pill">
            {brief.aspect_ratio || '16:9'} • {brief.content_type || 'VIDEO'}
          </span>
        </div>
      </div>

      {/* Brief Details Content */}
      <div className="brief-card-content">
        {/* Brand Identity Row */}
        <div className="brief-card-brand-row">
          <BrandLogo brand={brief.brand} brandName={brandName} height={20} width={64} shape="rounded" />
          <span className="brief-brand-name-text">{brandName}</span>
          <span className="brief-verified-check" title="Verified Commercial Client">
            ✓
          </span>
        </div>

        {/* Campaign Title */}
        <h3 className="brief-card-title" title={brief.title}>
          {brief.title}
        </h3>

        {/* Campaign Objective / Description (Clamped) */}
        <p className="brief-card-desc">
          {brief.campaign_objective || brief.deliverables_description || 'Commercial creative production brief with full commercial rights.'}
        </p>

        {/* Requirements Chips */}
        <div className="brief-card-skills-row">
          {(brief.required_skills || []).slice(0, 2).map((s, i) => (
            <span key={i} className="brief-skill-chip">
              {s.name || s.skill_id}
            </span>
          ))}
          {(brief.required_tools || []).slice(0, 2).map((t, i) => (
            <span key={i} className="brief-tool-chip">
              {t.name || t.tool_id}
            </span>
          ))}
          {(!brief.required_skills?.length && !brief.required_tools?.length) && (
            <span className="brief-skill-chip">AI Synthesis</span>
          )}
        </div>

        {/* Footer: Budget & CTA */}
        <div className="brief-card-footer">
          <div className="brief-budget-wrap">
            <span className="brief-budget-label">Total Compensation</span>
            <span className="brief-budget-val">
              ${(brief.budget_amount || 0).toLocaleString()}
              <span className="brief-currency-code"> {brief.budget_currency || 'USD'}</span>
            </span>
          </div>

          <button
            type="button"
            className="brief-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectBrief?.(brief);
            }}
          >
            <span>Review Scope</span>
            <span className="view-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
