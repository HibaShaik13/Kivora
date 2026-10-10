import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MagnifyingGlass,
  Sliders,
  ShieldCheck,
  Star,
  ArrowRight,
  Sparkle,
  X,
  ArrowsClockwise,
  WarningCircle,
  Funnel,
  CaretDown,
  Check,
  Tag,
} from '@phosphor-icons/react';
import { creatorsApi } from '../api/creators';
import { taxonomyApi } from '../api/taxonomy';
import SafeImage from '../components/common/SafeImage';

export default function CreatorDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL search params state bindings
  const searchTerm = searchParams.get('search') || '';
  const selectedTool = searchParams.get('tool') || '';
  const selectedSkill = searchParams.get('skill') || '';
  const selectedSpecialization = searchParams.get('specialization') || '';
  const selectedContentType = searchParams.get('content_type') || '';
  const selectedAspectRatio = searchParams.get('aspect_ratio') || '';
  const selectedTier = searchParams.get('verification_tier') || '';
  const onlyVerified = searchParams.get('only_verified') === 'true';
  const selectedAvailability = searchParams.get('availability') || '';
  const maxBudget = searchParams.get('max_budget') || '';
  const sortBy = searchParams.get('sort_by') || 'rating_desc';

  // Component state
  const [creators, setCreators] = useState([]);
  const [toolsList, setToolsList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);

  // 1. Load Taxonomy Catalogs
  useEffect(() => {
    Promise.all([taxonomyApi.getTools(), taxonomyApi.getSkills()])
      .then(([tools, skills]) => {
        setToolsList(tools || []);
        setSkillsList(skills || []);
      })
      .catch((err) => console.warn('Taxonomy load warning:', err));
  }, []);

  // 2. Fetch Creators from API based on active searchParams
  const fetchCreators = useCallback(() => {
    setLoading(true);
    setError(null);

    const queryParams = {};
    if (searchTerm) queryParams.search = searchTerm;
    if (selectedTool) queryParams.tool = selectedTool;
    if (selectedSkill) queryParams.skill = selectedSkill;
    if (selectedSpecialization) queryParams.specialization = selectedSpecialization;
    if (selectedContentType) queryParams.content_type = selectedContentType;
    if (selectedAspectRatio) queryParams.aspect_ratio = selectedAspectRatio;
    if (selectedTier) queryParams.verification_tier = selectedTier;
    if (onlyVerified) queryParams.only_verified = true;
    if (selectedAvailability) queryParams.availability = selectedAvailability;
    if (maxBudget) queryParams.max_budget = Number(maxBudget);
    if (sortBy) queryParams.sort_by = sortBy;

    creatorsApi
      .list(queryParams)
      .then((data) => {
        setCreators(data || []);
      })
      .catch((err) => {
        console.error('Failed to load creators:', err);
        setError(err.message || 'Unable to retrieve creators from registry.');
      })
      .finally(() => setLoading(false));
  }, [
    searchTerm,
    selectedTool,
    selectedSkill,
    selectedSpecialization,
    selectedContentType,
    selectedAspectRatio,
    selectedTier,
    onlyVerified,
    selectedAvailability,
    maxBudget,
    sortBy,
  ]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  // Helper to update individual URL query params
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === undefined || value === '' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    setSearchParams(newParams);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        updateFilter('search', searchInput);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Count active filter criteria
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedTool) count++;
    if (selectedSkill) count++;
    if (selectedSpecialization) count++;
    if (selectedContentType) count++;
    if (selectedAspectRatio) count++;
    if (selectedTier) count++;
    if (onlyVerified) count++;
    if (selectedAvailability) count++;
    if (maxBudget) count++;
    return count;
  }, [
    searchTerm,
    selectedTool,
    selectedSkill,
    selectedSpecialization,
    selectedContentType,
    selectedAspectRatio,
    selectedTier,
    onlyVerified,
    selectedAvailability,
    maxBudget,
  ]);

  return (
    <div style={{ padding: '40px 0 100px' }}>
      <div className="container">
        {/* Editorial Heading */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-verified">
              <Sparkle weight="fill" size={13} />
              Generative Marketplace
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Vetted generative creators and studios.
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '58ch' }}>
            Search evidence-backed creators by tool mastery, aspect ratio capability, workflow evidence, and verified studio tier.
          </p>
        </div>

        {/* Search & Sort Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '520px' }}>
            <MagnifyingGlass
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by creator name, bio, tool, or specialization..."
              className="form-input"
              style={{
                paddingLeft: '42px',
                paddingRight: searchInput ? '36px' : '14px',
                height: '46px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--bg-surface)',
              }}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateFilter('search', '');
                }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Right Actions: Sort + Mobile Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="btn btn-outline md-hidden"
              style={{ padding: '10px 16px', fontSize: '0.875rem' }}
            >
              <Funnel size={16} />
              <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
            </button>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => updateFilter('sort_by', e.target.value)}
                className="form-select"
                style={{
                  height: '44px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="rating_desc">Top Rated</option>
                <option value="verified_claims_desc">Most Verified Claims</option>
                <option value="experience_desc">Most Experienced</option>
                <option value="budget_asc">Budget: Low to High</option>
                <option value="budget_desc">Budget: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-tertiary)' }}>
              Active Filters ({activeFiltersCount}):
            </span>

            {selectedTool && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Tool: {selectedTool}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('tool', '')} />
              </span>
            )}
            {selectedSkill && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Skill: {selectedSkill}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('skill', '')} />
              </span>
            )}
            {selectedContentType && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Format: {selectedContentType}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('content_type', '')} />
              </span>
            )}
            {selectedAspectRatio && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Ratio: {selectedAspectRatio}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('aspect_ratio', '')} />
              </span>
            )}
            {selectedTier && (
              <span className="badge badge-verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Tier: {selectedTier.replace('_', ' ')}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('verification_tier', '')} />
              </span>
            )}
            {onlyVerified && (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Verified Only
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('only_verified', false)} />
              </span>
            )}
            {selectedAvailability && (
              <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Availability: {selectedAvailability}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter('availability', '')} />
              </span>
            )}

            <button
              onClick={resetFilters}
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--accent-coral)' }}
            >
              Reset All
            </button>
          </div>
        )}

        {/* Main Layout: Filter Sidebar + Creators Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Filter Sidebar (Desktop) */}
          <aside
            className="card-editorial"
            style={{
              padding: '24px',
              background: 'var(--bg-surface)',
              position: 'sticky',
              top: '90px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.9375rem' }}>
                <Sliders size={18} />
                <span>Filters</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-coral)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Verification Status */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Verification Tier
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                {[
                  { id: '', label: 'All Tiers' },
                  { id: 'TOP_STUDIO', label: 'Top Studio (Tier 3)' },
                  { id: 'VERIFIED_PRO', label: 'Verified Pro (Tier 2)' },
                  { id: 'COMMUNITY', label: 'Community' },
                ].map((tier) => (
                  <label key={tier.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tier"
                      checked={selectedTier === tier.id}
                      onChange={() => updateFilter('verification_tier', tier.id)}
                    />
                    <span style={{ color: selectedTier === tier.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {tier.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Content Format */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Content Format
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                {['', 'VIDEO', 'IMAGE', 'PRODUCT_VIZ', 'ANIMATION', 'CONCEPT_ART'].map((fmt) => (
                  <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="contentType"
                      checked={selectedContentType === fmt}
                      onChange={() => updateFilter('content_type', fmt)}
                    />
                    <span style={{ color: selectedContentType === fmt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {fmt === '' ? 'All Formats' : fmt.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Aspect Ratio
              </label>
              <select
                value={selectedAspectRatio}
                onChange={(e) => updateFilter('aspect_ratio', e.target.value)}
                className="form-select"
                style={{ fontSize: '0.875rem', width: '100%' }}
              >
                <option value="">Any Aspect Ratio</option>
                <option value="16:9">16:9 Landscape (4K)</option>
                <option value="9:16">9:16 Vertical (Social)</option>
                <option value="1:1">1:1 Square (Feed)</option>
                <option value="2.39:1">2.39:1 Anamorphic</option>
              </select>
            </div>

            {/* AI Generative Tool */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Generative Tool
              </label>
              <select
                value={selectedTool}
                onChange={(e) => updateFilter('tool', e.target.value)}
                className="form-select"
                style={{ fontSize: '0.875rem', width: '100%' }}
              >
                <option value="">Any AI Model / Tool</option>
                {toolsList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.vendor})
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Availability Status
              </label>
              <select
                value={selectedAvailability}
                onChange={(e) => updateFilter('availability', e.target.value)}
                className="form-select"
                style={{ fontSize: '0.875rem', width: '100%' }}
              >
                <option value="">Any Availability</option>
                <option value="AVAILABLE">Available Now</option>
                <option value="LIMITED">Limited Availability</option>
                <option value="BOOKED">Booked</option>
              </select>
            </div>
          </aside>

          {/* Creators Listing Section */}
          <div>
            {/* Results Count Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{creators.length}</strong> evidence-verified creator{creators.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="card-editorial"
                    style={{
                      height: '260px',
                      background: 'var(--bg-surface-subtle)',
                      animation: 'pulse 1.5s infinite ease-in-out',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <WarningCircle size={40} style={{ color: 'var(--accent-coral)', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Registry Connection Issue</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>{error}</p>
                <button onClick={fetchCreators} className="btn btn-outline">
                  <ArrowsClockwise size={16} />
                  <span>Retry Search</span>
                </button>
              </div>
            )}

            {/* Empty Results State */}
            {!loading && !error && creators.length === 0 && (
              <div className="card-editorial" style={{ textAlign: 'center', padding: '64px 32px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <MagnifyingGlass size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No creators matched your criteria</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '44ch', margin: '0 auto 24px' }}>
                  Try adjusting your filters or broadening your search terms to discover verified generative talent.
                </p>
                <button onClick={resetFilters} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Creators Grid */}
            {!loading && !error && creators.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {creators.map((creator) => (
                  <Link
                    key={creator.id}
                    to={`/creators/${creator.handle || creator.id}`}
                    className="card-editorial"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: '24px',
                    }}
                  >
                    <div>
                      {/* Top Row: Avatar + Handle + Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '14px',
                              background: 'linear-gradient(135deg, #101530 0%, #151C3F 100%)',
                              border: '1px solid var(--accent-gold-border)',
                              color: 'var(--accent-gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '1.125rem',
                              overflow: 'hidden',
                            }}
                          >
                            <SafeImage
                              src={creator.avatar_url}
                              alt={creator.display_name}
                              fallbackInitials={creator.display_name?.charAt(0) || 'C'}
                              fallbackBg="linear-gradient(135deg, #101530 0%, #151C3F 100%)"
                              fallbackColor="var(--accent-gold)"
                              style={{ width: '100%', height: '100%' }}
                              objectFit="cover"
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                              {creator.display_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family-mono)' }}>
                              @{creator.handle} • {creator.location}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`badge ${
                            creator.verification_tier === 'TOP_STUDIO'
                              ? 'badge-verified'
                              : creator.verification_tier === 'VERIFIED_PRO'
                              ? 'badge-success'
                              : 'badge-neutral'
                          }`}
                          style={{ fontSize: '0.625rem' }}
                        >
                          <ShieldCheck weight="fill" size={12} />
                          {creator.verification_tier?.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Specialization */}
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--accent-lavender)', marginBottom: '8px' }}>
                        {creator.primary_specialization}
                      </div>

                      {/* Bio snippet */}
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                          marginBottom: '16px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {creator.bio}
                      </p>

                      {/* Tool Chips with verification badge indicator */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                        {creator.tools?.slice(0, 3).map((t) => (
                          <span
                            key={t.tool_id}
                            className={`badge ${t.is_claim_verified ? 'badge-neutral' : 'badge-neutral'}`}
                            style={{
                              fontSize: '0.6875rem',
                              padding: '3px 8px',
                              border: t.is_claim_verified ? '1px solid var(--accent-lavender-border)' : '1px solid var(--border-subtle)',
                            }}
                          >
                            {t.is_claim_verified && <ShieldCheck size={11} style={{ color: 'var(--accent-lavender)' }} />}
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Metrics */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        <Star weight="fill" size={14} style={{ color: '#EAB308' }} />
                        <span>{creator.average_rating ? Number(creator.average_rating).toFixed(1) : '5.0'}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: '400', fontSize: '0.75rem' }}>
                          ({creator.completed_projects_count || 0})
                        </span>
                      </div>

                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        ${creator.min_budget?.toLocaleString()}{' '}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: '400' }}>min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
