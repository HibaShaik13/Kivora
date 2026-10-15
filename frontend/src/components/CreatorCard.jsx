import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getCreatorAvatar, getCreatorCover } from '../utils/visualAssetHelpers';

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

  // Resolved unique avatar & cover image
  const avatarUrl = getCreatorAvatar(creator);
  const coverUrl = getCreatorCover(creator);

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
      {/* Top Media Cover Section */}
      <div className="creator-card-media-wrap">
        <img
          src={coverUrl}
          alt={`${creator.display_name} cover`}
          className="creator-card-cover-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/portfolio/sophia_cellular_dew_thumb.jpg';
          }}
        />

        {/* Verification Overlay Badge */}
        {tierLabel && (
          <span className="creator-card-tier-badge">
            <span className="tier-star">★</span> {tierLabel}
          </span>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          className={`creator-card-fav-btn ${isFavorited ? 'active' : ''}`}
          onClick={handleToggleFavorite}
          title={isFavorited ? 'Remove from saved creators' : 'Save creator'}
          aria-label={isFavorited ? 'Remove from saved creators' : 'Save creator'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isFavorited ? '#DC2626' : 'none'}
            stroke={isFavorited ? '#DC2626' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Creator Avatar overlapping edge */}
        <div className="creator-card-avatar-anchor">
          <img
            src={avatarUrl}
            alt={creator.display_name}
            className="creator-card-avatar-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getCreatorAvatar(creator);
            }}
          />
          {isVerified && (
            <span className="creator-card-avatar-check" title="Verified Creator">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="creator-card-body">
        {/* Creator Name & Subtitle */}
        <div className="creator-header-row">
          <h3 className="creator-name-heading">{creator.display_name}</h3>
          <span className="creator-handle-text">@{creator.handle}</span>
        </div>

        {/* Specialization / Bio */}
        <p className="creator-bio-text">
          {creator.bio || creator.primary_specialization || 'Generative visual artist & director creating premium commercial narratives.'}
        </p>

        {/* Visual Skills & Tools Chips */}
        <div className="creator-chips-cluster">
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

        {/* Bottom Pricing & Primary CTA Row */}
        <div className="creator-card-footer">
          <div className="creator-rate-block">
            <span className="rate-label">Starting at</span>
            <span className="rate-value">
              ${(creator.min_budget || 2500).toLocaleString()}
              <span className="rate-period"> / project</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentUser?.role === 'BRAND' && onInviteCreator && (
              <button
                type="button"
                className="btn-invite-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  onInviteCreator(creator);
                }}
              >
                Invite ✉️
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
                Chat 💬
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
    </div>
  );
}
