import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getCreatorAvatar } from '../utils/visualAssetHelpers';
import { formatINR, clampDemoBudget } from '../utils/indianLocalization';

export default function CreatorCard({
  creator,
  onSelectCreator,
  onInviteCreator,
  isSaved: initialSaved,
  onToggleSave,
  onOpenChat,
}) {
  const [isFavorited, setIsFavorited] = useState(Boolean(initialSaved));
  const currentUser = getCurrentUser();

  // Check saved status on mount if not provided via props
  useEffect(() => {
    if (initialSaved !== undefined) {
      setIsFavorited(Boolean(initialSaved));
    } else if (currentUser && currentUser.role === 'BRAND' && creator.id) {
      api.getCreatorSavedStatus(creator.id)
        .then((res) => setIsFavorited(Boolean(res?.is_saved)))
        .catch(() => null);
    }
  }, [creator.id, currentUser, initialSaved]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!currentUser || currentUser.role !== 'BRAND') {
      alert('Sign in as a Brand to save creators to your talent roster.');
      return;
    }
    const previousState = isFavorited;
    const nextState = !previousState;
    setIsFavorited(nextState);
    try {
      if (previousState) {
        await api.unsaveCreator(creator.id);
      } else {
        await api.saveCreator(creator.id);
      }
      if (onToggleSave) onToggleSave(creator.id, nextState);
    } catch (err) {
      setIsFavorited(previousState);
      console.error('Error toggling creator favorite:', err);
    }
  };

  const avatarUrl = getCreatorAvatar(creator);

  const isVerified =
    creator.verification_tier === 'TOP_STUDIO' ||
    creator.verification_tier === 'VERIFIED_PRO' ||
    creator.is_verified;

  const tierLabel =
    creator.verification_tier === 'TOP_STUDIO'
      ? 'Top Studio'
      : creator.verification_tier === 'VERIFIED_PRO'
      ? 'Verified Pro'
      : isVerified
      ? 'Verified'
      : null;

  // Gather skills & tools chips
  const allChips = [
    ...(creator.skills || []).map((s) => s.name || s.skill_id),
    ...(creator.tools || []).map((t) => t.name || t.tool_id),
  ].filter(Boolean);

  const visibleChips = allChips.slice(0, 3);
  const remainingCount = allChips.length - visibleChips.length;

  const locationText = creator.location || 'Remote / Worldwide';
  const specialization = creator.primary_specialization || 'Generative Director & 3D Artist';

  return (
    <div
      className="kivora-creator-card"
      onClick={() => onSelectCreator?.(creator)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectCreator?.(creator);
        }
      }}
    >
      {/* Top Header Row with Square Profile Picture */}
      <div className="creator-card-top">
        <div className="creator-card-avatar-wrap">
          <img
            src={avatarUrl}
            alt={creator.display_name}
            className="creator-card-square-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/creator-portraits/devon.jpg';
            }}
          />
          {isVerified && (
            <span className="creator-card-badge-dot" title="Verified Creator">
              ✓
            </span>
          )}
        </div>

        <div className="creator-card-header-info">
          <div className="creator-card-title-row">
            <h3 className="creator-card-name" title={creator.display_name}>
              {creator.display_name}
            </h3>
            {tierLabel && (
              <span className="creator-card-tier-tag">
                <span className="tier-star">★</span> {tierLabel}
              </span>
            )}
          </div>
          <div className="creator-card-meta-line">
            <span className="creator-card-handle">@{creator.handle}</span>
            <span className="creator-card-meta-dot">•</span>
            <span className="creator-card-location" title={locationText}>
              📍 {locationText}
            </span>
          </div>
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`creator-card-fav-btn ${isFavorited ? 'active' : ''}`}
          onClick={handleToggleFavorite}
          title={isFavorited ? 'Remove from saved' : 'Save creator'}
          aria-label={isFavorited ? 'Remove from saved' : 'Save creator'}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isFavorited ? '#DC2626' : 'none'}
            stroke={isFavorited ? '#DC2626' : '#6B7280'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      {/* Specialization Tag */}
      <div className="creator-card-spec-wrap">
        <span className="creator-card-spec-badge">
          {specialization}
        </span>
      </div>

      {/* Short Biography */}
      <p className="creator-card-bio" title={creator.bio || specialization}>
        {creator.bio || `${specialization} crafting forward-thinking visuals and immersive commercial assets.`}
      </p>

      {/* Skill Tags */}
      <div className="creator-card-chips-row">
        {visibleChips.map((chip, i) => (
          <span key={i} className="creator-chip">
            {chip}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="creator-chip remaining">+{remainingCount}</span>
        )}
        {visibleChips.length === 0 && (
          <>
            <span className="creator-chip">3D & CGI</span>
            <span className="creator-chip">Generative AI</span>
          </>
        )}
      </div>

      {/* Bottom Pricing & Actions */}
      <div className="creator-card-footer">
        <div className="creator-rate-block">
          <span className="rate-label">Starting at</span>
          <span className="rate-value">
            {formatINR(clampDemoBudget(creator.min_budget, 25000))}
            <span className="rate-period"> / proj</span>
          </span>
        </div>

        <div className="creator-card-actions-cluster">
          {currentUser?.role === 'BRAND' && onInviteCreator && (
            <button
              type="button"
              className="btn-invite-pill"
              onClick={(e) => {
                e.stopPropagation();
                onInviteCreator(creator);
              }}
              title="Invite creator to brief"
            >
              Invite
            </button>
          )}

          {currentUser?.role === 'BRAND' && onOpenChat && (
            <button
              type="button"
              className="btn-chat-pill"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await api.getContextualConversation({ creator_id: creator.id });
                  if (res?.status === 'found' && res.conversation) {
                    onOpenChat({
                      conversationId: res.conversation.id,
                      creatorId: creator.id,
                      creatorName: creator.display_name,
                    });
                  } else {
                    onSelectCreator?.(creator);
                  }
                } catch {
                  onSelectCreator?.(creator);
                }
              }}
              title="Chat with creator"
            >
              Chat
            </button>
          )}

          <button
            type="button"
            className="creator-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCreator?.(creator);
            }}
          >
            <span>View Profile</span>
            <span className="view-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
