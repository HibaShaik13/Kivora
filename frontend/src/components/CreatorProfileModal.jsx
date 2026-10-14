import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getCreatorAvatar } from '../utils/visualAssetHelpers';

export default function CreatorProfileModal({
  creator,
  brief,
  currentUser: propUser,
  isOpen,
  onClose,
  onSelectProject,
  onPostBrief,
  onInviteCreator,
  onOpenChat,
}) {
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'workflow' | 'about' | 'reviews'
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [chatIneligibleNotice, setChatIneligibleNotice] = useState(null);
  const currentUser = propUser || getCurrentUser();

  const handleChatClick = async () => {
    if (!currentUser) {
      alert('Sign in as a Brand to chat with creators.');
      return;
    }
    if (currentUser.role !== 'BRAND') {
      alert('Creator-to-creator messaging is not supported.');
      return;
    }
    try {
      setIsCheckingChat(true);
      setChatIneligibleNotice(null);
      const creatorTargetId = creator.id || creator.creator_id || creator.user_id;
      const briefTargetId = brief?.id;
      const res = await api.getContextualConversation({
        creator_id: creatorTargetId,
        brief_id: briefTargetId,
      });
      if (res?.status === 'found' && res.conversation) {
        if (onOpenChat) {
          onOpenChat({
            conversationId: res.conversation.id,
            creatorId: creatorTargetId,
            briefId: briefTargetId,
            creatorName: creator.display_name,
          });
        } else {
          onClose();
        }
      } else {
        setChatIneligibleNotice(
          res?.reason ||
            `Direct messaging unlocks once you have an accepted collaboration or brief invitation with ${creator.display_name}. Invite them to an active brief to start collaborating.`
        );
      }
    } catch (err) {
      console.error('Error starting chat with creator:', err);
      setChatIneligibleNotice(err.message || 'Unable to open chat conversation.');
    } finally {
      setIsCheckingChat(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'BRAND' && creator?.id) {
      api.getCreatorSavedStatus(creator.id)
        .then((res) => setIsSaved(Boolean(res?.is_saved)))
        .catch(() => null);
    }
  }, [creator?.id, currentUser]);

  if (!isOpen || !creator) return null;

  const projects = creator.portfolio_projects || [];

  const handleToggleSave = async () => {
    if (!currentUser || currentUser.role !== 'BRAND') {
      alert('Sign in as a Brand to save creators to your talent roster.');
      return;
    }
    try {
      if (isSaved) {
        await api.unsaveCreator(creator.id);
        setIsSaved(false);
      } else {
        await api.saveCreator(creator.id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save creator:', err);
    }
  };

  const avatarUrl = getCreatorAvatar(creator);
  const bannerUrl = creator.banner_url || `/assets/banners/${(creator.handle || 'elena').split('_')[0]}_banner.jpg`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="kivora-profile-modal-container glass-panel"
        style={{
          maxWidth: '840px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '24px',
          background: '#FAF7F2',
          border: '1px solid rgba(121, 82, 236, 0.16)',
          boxShadow: '0 24px 64px -12px rgba(17, 18, 21, 0.28)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Banner with Overlay & Top Header Actions */}
        <div className="profile-modal-banner-wrap" style={{ position: 'relative', height: '120px', flexShrink: 0 }}>
          <img
            src={bannerUrl}
            alt={`${creator.display_name} Banner`}
            className="profile-modal-banner-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/banners/elena_banner.jpg';
            }}
          />
          <div className="profile-modal-banner-overlay" />
          <div className="profile-modal-top-bar" style={{ zIndex: 10 }}>
            <button
              type="button"
              className="modal-icon-action-btn"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Profile link copied to clipboard!');
              }}
              title="Share profile"
            >
              ↗ Share
            </button>
            <button
              type="button"
              className="modal-icon-action-btn"
              onClick={handleToggleSave}
              title={isSaved ? "Saved in talent roster" : "Save creator to roster"}
              style={{
                color: isSaved ? '#7952EC' : '#111',
                fontWeight: isSaved ? '700' : '600',
              }}
            >
              {isSaved ? '♥ Saved' : '♡ Save'}
            </button>
            <button
              type="button"
              className="modal-close-round-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Main Body (Scrollable container) */}
        <div className="profile-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '0 1.5rem 1.5rem' }}>
          {/* Profile Hero Header */}
          <div className="profile-modal-hero-grid" style={{ marginBottom: '1rem' }}>
            {/* Left Column: Portrait & Thumbnails */}
            <div className="profile-hero-left">
              <div className="profile-main-portrait-wrapper">
                <img
                  src={avatarUrl}
                  alt={creator.display_name}
                  className="profile-main-portrait-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getCreatorAvatar(creator);
                  }}
                />
              </div>
              {/* Projects Subthumbnails */}
              {projects.length > 0 && (
                <div className="profile-portrait-thumbs-row">
                  {projects.slice(0, 3).map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="profile-portrait-subthumb"
                      onClick={() => onSelectProject && onSelectProject(p)}
                      title={p.title}
                    >
                      <img
                        src={p.thumbnail_url || p.primary_asset_url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/portfolio/sophia_cellular_dew_thumb.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Middle Column: Info, Bio, Buttons */}
            <div className="profile-hero-middle">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="profile-display-name text-xl font-bold">{creator.display_name}</h1>
                <span className="text-xs text-neutral-500">@{creator.handle}</span>
                {creator.verification_tier && creator.verification_tier !== 'COMMUNITY' && (
                  <span className="purple-check-badge-large" title="Verified Creator">
                    ✓
                  </span>
                )}
              </div>
              <p className="profile-role-text">
                {creator.primary_specialization || 'AI Creative Specialist'}
              </p>

              <div className="profile-meta-chips-row">
                <span>📍 {creator.location || 'Remote'}</span>
                <span>•</span>
                <span>
                  {creator.average_rating ? (
                    `⭐ ${creator.average_rating.toFixed(1)} (${creator.completed_projects_count || 0} completed)`
                  ) : (
                    '⭐ New Talent'
                  )}
                </span>
                <span>•</span>
                <span className="profile-tier-badge">
                  {creator.verification_tier === 'TOP_STUDIO'
                    ? '👑 Top Studio'
                    : creator.verification_tier === 'VERIFIED_PRO'
                    ? '🛡 Pro Tier'
                    : 'Verified Creator'}
                </span>
              </div>

              {creator.bio && (
                <p className="profile-bio-manifesto text-xs leading-relaxed text-neutral-700 mt-2">
                  {creator.bio}
                </p>
              )}

              {/* Skills & Tools chips */}
              <div className="profile-skills-pills-row mt-2">
                {creator.tools && creator.tools.map((t) => (
                  <span key={t.tool_id || t.name} className="profile-tag-pill">
                    {t.name || (t.tool && t.tool.name) || t.tool_id}
                  </span>
                ))}
                {creator.skills && creator.skills.map((s) => (
                  <span key={s.skill_id || s.name} className="profile-tag-pill">
                    {s.name || (s.skill && s.skill.name) || s.skill_id}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="profile-cta-buttons-row mt-3 flex flex-wrap gap-2">
                {currentUser?.role === 'BRAND' && (
                  <button
                    type="button"
                    className="profile-btn-chat"
                    onClick={handleChatClick}
                    disabled={isCheckingChat}
                    style={{
                      backgroundColor: '#FAF8F5',
                      color: '#7952EC',
                      border: '1.5px solid #7952EC',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: isCheckingChat ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isCheckingChat ? 'Opening...' : '💬 Chat'}
                  </button>
                )}
                {onInviteCreator && (
                  <button
                    type="button"
                    className="profile-btn-contact"
                    style={{ backgroundColor: '#7952EC', color: '#FFFFFF', border: 'none', fontWeight: '700' }}
                    onClick={() => onInviteCreator(creator)}
                  >
                    Invite to Brief ✉️
                  </button>
                )}
                {onPostBrief && (
                  <button
                    type="button"
                    className="profile-btn-contact"
                    onClick={() => {
                      onClose();
                      onPostBrief();
                    }}
                  >
                    Post Campaign Brief
                  </button>
                )}
                <button
                  type="button"
                  className="profile-btn-availability"
                  onClick={() => {
                    alert(`Creator availability status: ${creator.availability_status || 'AVAILABLE'}. Minimum project budget: $${(creator.min_budget || 2500).toLocaleString()}.`);
                  }}
                >
                  {creator.availability_status || 'Available'} • Rate: ${(creator.min_budget || 2500).toLocaleString()}
                </button>
              </div>

              {chatIneligibleNotice && (
                <div
                  style={{
                    backgroundColor: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#4C1D95',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ lineHeight: 1.4 }}>🔒 {chatIneligibleNotice}</span>
                    <button
                      type="button"
                      onClick={() => setChatIneligibleNotice(null)}
                      style={{ background: 'none', border: 'none', color: '#6D28D9', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}
                      aria-label="Dismiss notice"
                    >
                      ✕
                    </button>
                  </div>
                  {onInviteCreator && (
                    <button
                      type="button"
                      onClick={() => {
                        setChatIneligibleNotice(null);
                        onInviteCreator(creator);
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#7952EC',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Send Brief Invitation ✉️
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Statistics Cluster */}
            <div className="profile-hero-right">
              <div className="profile-stat-item">
                <span className="profile-stat-number">{creator.completed_projects_count || 0}</span>
                <span className="profile-stat-title">Completed</span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-number">{creator.years_experience ? `${creator.years_experience}+` : '2+'}</span>
                <span className="profile-stat-title">Years Exp</span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-number">{projects.length}</span>
                <span className="profile-stat-title">Portfolio Items</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="profile-tabs-nav-bar mb-4">
            {[
              { id: 'portfolio', label: `Portfolio (${projects.length})` },
              { id: 'about', label: 'About & Rates' },
              { id: 'workflow', label: 'Workflow Pipeline' },
              { id: 'reviews', label: 'Client Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`profile-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content 1: Portfolio Gallery */}
          {activeTab === 'portfolio' && (
            <div>
              {projects.length === 0 ? (
                <div className="p-8 text-center bg-white/70 rounded-2xl border border-black/5">
                  <span className="text-3xl block mb-2">🎨</span>
                  <h4 className="text-sm font-bold text-neutral-800">No portfolio projects published yet</h4>
                  <p className="text-xs text-neutral-500 mt-1">This creator has not added public portfolio projects to their profile.</p>
                </div>
              ) : (
                <div className="profile-portfolio-gallery-grid">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="portfolio-gallery-card"
                      onClick={() => onSelectProject && onSelectProject(proj)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="portfolio-gallery-thumb-wrap" style={{ position: 'relative', overflow: 'hidden', height: '140px' }}>
                        <img
                          src={proj.thumbnail_url || proj.primary_asset_url}
                          alt={proj.title}
                          className="portfolio-gallery-img w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/portfolio/sophia_cellular_dew_thumb.jpg';
                          }}
                        />
                        {(proj.content_type === 'VIDEO' || proj.content_type === 'ANIMATION') && (
                          <div className="gallery-play-overlay">
                            <div className="play-circle-icon">▶</div>
                          </div>
                        )}
                        <span className="gallery-format-pill">
                          {proj.aspect_ratio || '16:9'}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{proj.title}</h4>
                        {proj.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{proj.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: About & Rates */}
          {activeTab === 'about' && (
            <div className="p-6 bg-white/70 rounded-2xl border border-black/5 space-y-4 text-xs">
              <h3 className="font-serif font-bold text-lg text-neutral-900">About {creator.display_name}</h3>
              <p className="leading-relaxed text-neutral-700">{creator.bio || 'Verified AI creator specialized in high-fidelity commercial imagery and video generation.'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-black/10">
                <div>
                  <span className="font-bold text-neutral-500 block uppercase text-[10px]">Location</span>
                  <span className="font-semibold text-neutral-900">{creator.location || 'Global / Remote'}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block uppercase text-[10px]">Min Project Budget</span>
                  <span className="font-semibold text-purple-700">${(creator.min_budget || 2500).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block uppercase text-[10px]">Hourly Rate</span>
                  <span className="font-semibold text-neutral-900">${creator.hourly_rate || 120}/hr</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block uppercase text-[10px]">Availability</span>
                  <span className="font-semibold text-emerald-700">{creator.availability_status || 'AVAILABLE'}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block uppercase text-[10px]">Audited Claims</span>
                  <span className="font-semibold text-neutral-900">{creator.verified_claims_count || 0} claims</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block uppercase text-[10px]">Verification Tier</span>
                  <span className="font-semibold text-purple-800">{creator.verification_tier || 'COMMUNITY'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Workflow */}
          {activeTab === 'workflow' && (
            <div className="p-6 bg-white/70 rounded-2xl border border-black/5 space-y-4">
              <h3 className="font-serif font-bold text-lg text-neutral-900">
                ⚡ ProofGraph Creative Production Workflow
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <strong>Stage 1: Prompt & Optics Architecture</strong>
                  <p className="text-neutral-600 mt-1">Multi-pass lighting seeds with custom LoRA embedding models and prompt manifests.</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <strong>Stage 2: Temporal Video Synthesis</strong>
                  <p className="text-neutral-600 mt-1">Runway Gen-3 Alpha / ComfyUI camera arc trajectories with motion vector interpolation.</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <strong>Stage 3: 4K Master Upscale & Color Grade</strong>
                  <p className="text-neutral-600 mt-1">Topaz Video AI ProRes render with DaVinci Resolve custom LUT mastering.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Reviews */}
          {activeTab === 'reviews' && (
            <div className="p-6 bg-white/70 rounded-2xl border border-black/5 space-y-4 text-xs">
              <h3 className="font-serif font-bold text-lg text-neutral-900">Verified Client Reviews</h3>
              {creator.average_rating ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white border border-black/5">
                    <div className="flex justify-between font-semibold">
                      <span>Verified Campaign Client</span>
                      <span className="text-amber-500">★★★★★ {creator.average_rating.toFixed(1)}</span>
                    </div>
                    <p className="text-neutral-600 mt-1 italic">
                      "Delivered photorealistic deliverables adhering strictly to brand guidelines and technical format specifications."
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500">
                  No verified client reviews submitted yet for this creator.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
