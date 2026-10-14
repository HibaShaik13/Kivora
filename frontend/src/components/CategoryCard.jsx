import React from 'react';
import CategoryIcon from './CategoryIcon';

export default function CategoryCard({
  category,
  isSelected,
  onClick,
  mode = 'creators', // 'creators' | 'briefs'
}) {
  if (!category) return null;

  const creatorCount = category.creator_count || 0;
  const briefCount = category.brief_count || category.open_brief_count || 0;

  // Decide primary and secondary metric based on discovery mode
  const primaryBadgeText =
    mode === 'creators'
      ? `${creatorCount} ${creatorCount === 1 ? 'creator' : 'creators'}`
      : `${briefCount} ${briefCount === 1 ? 'brief' : 'briefs'}`;

  const secondaryMetaText =
    mode === 'creators'
      ? briefCount > 0 ? `${briefCount} briefs` : null
      : creatorCount > 0 ? `${creatorCount} talent` : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`kivora-category-card ${isSelected ? 'active' : ''}`}
      aria-pressed={isSelected}
    >
      <div className="cat-card-header">
        <div className="cat-card-icon-wrap">
          <CategoryIcon name={category.icon || category.slug} size={18} />
        </div>
        {isSelected ? (
          <span className="cat-card-selected-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Active
          </span>
        ) : (
          <span className="cat-card-count-badge">{primaryBadgeText}</span>
        )}
      </div>

      <div className="cat-card-body">
        <h4 className="cat-card-title">{category.name}</h4>
        <div className="cat-card-submeta">
          {isSelected ? (
            <span className="cat-card-active-text">{primaryBadgeText}</span>
          ) : (
            <span>{secondaryMetaText || 'Browse Domain'}</span>
          )}
        </div>
      </div>
    </button>
  );
}
