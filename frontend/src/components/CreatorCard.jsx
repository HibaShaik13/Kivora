import React from 'react';

export default function CreatorCard({ creator, onSelectCreator }) {
  // Use creator avatar or specific portrait image
  const avatarUrl = creator.avatar_url || `/assets/avatars/${(creator.handle || 'elena').split('_')[0]}.jpg`;
  const isVerified = creator.verification_tier === 'TOP_STUDIO' || creator.verification_tier === 'VERIFIED_PRO' || creator.is_verified;

  return (
    <div
      className="kivora-creator-card"
      onClick={() => onSelectCreator(creator)}
    >
      {/* Top Portrait Image */}
      <div className="creator-card-image-wrapper">
        <img
          src={avatarUrl}
          alt={creator.display_name}
          className="creator-card-portrait-img"
          onError={(e) => {
            e.target.src = '/assets/avatars/elena.jpg';
          }}
        />
        <button
          type="button"
          className="card-favorite-btn"
          onClick={(e) => {
            e.stopPropagation();
          }}
          title="Save to favorites"
        >
          ♡
        </button>
        <span className="card-overlay-tag">
          {creator.verification_tier === 'TOP_STUDIO' ? '👑 Top Studio' : '✓ Verified'}
        </span>
      </div>

      {/* Card Info Details */}
      <div className="creator-card-info">
        <div className="creator-card-name-row">
          <h3 className="creator-card-name">{creator.display_name}</h3>
          {isVerified && (
            <span className="purple-check-badge" title="Verified Creator">
              ✓
            </span>
          )}
        </div>

        <p className="creator-card-role">
          {creator.primary_specialization || '3D & Motion Artist'}
        </p>

        {/* Skill / Tool Tag Pills */}
        <div className="creator-card-tag-chips">
          {creator.tools && creator.tools.slice(0, 2).map((ct) => (
            <span key={ct.tool_id || ct.name} className="mini-tag-pill">
              {ct.name || (ct.tool && ct.tool.name) || ct.tool_id}
            </span>
          ))}
          {creator.skills && creator.skills.slice(0, 1).map((cs) => (
            <span key={cs.skill_id || cs.name} className="mini-tag-pill">
              {cs.name || (cs.skill && cs.skill.name) || cs.skill_id}
            </span>
          ))}
          {(!creator.tools || creator.tools.length === 0) && (
            <>
              <span className="mini-tag-pill">3D & CGI</span>
              <span className="mini-tag-pill">Motion</span>
            </>
          )}
        </div>

        {/* Bottom Footer Row */}
        <div className="creator-card-bottom-row">
          <span className="creator-card-rate">
            Min ${creator.min_budget?.toLocaleString() || '2,500'}
          </span>
          <button
            type="button"
            className="card-arrow-circle-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCreator(creator);
            }}
          >
            ↗
          </button>
        </div>
      </div>
    </div>
  );
}
