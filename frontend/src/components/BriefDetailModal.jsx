import React, { useState, useEffect } from 'react';
import { matchingService } from '../services/matchingService';
import { briefService } from '../services/briefService';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getBriefCoverImage, getCreatorAvatar } from '../utils/visualAssetHelpers';
import BrandLogo from './BrandLogo';

export default function BriefDetailModal({ brief, onClose, onSelectCreator, currentUser, onOpenChat }) {
  const activeUser = currentUser || getCurrentUser();
  const isCreatorUser = activeUser?.role?.toUpperCase() === 'CREATOR';
  const isBrandUser = activeUser?.role?.toUpperCase() === 'BRAND';
  const isBrandOwner =
    isBrandUser &&
    activeUser?.brand_profile &&
    brief?.brand_id === activeUser.brand_profile.id;

  const brandName = brief?.brand?.company_name || 'Brand Partner';

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [pitchText, setPitchText] = useState('');
  const [proposedRate, setProposedRate] = useState(brief?.budget_amount || 3500);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [isDraftingPitch, setIsDraftingPitch] = useState(false);
  const [pitchDraftedEngine, setPitchDraftedEngine] = useState(null);

  // Chat & relationship states
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [chatIneligibleNotice, setChatIneligibleNotice] = useState(null);
  const [contextualStatus, setContextualStatus] = useState(null);

  // Saved brief states
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check saved status and contextual eligibility on mount
  useEffect(() => {
    if (!brief?.id || !isCreatorUser) return;
    let isCancelled = false;

    api.getBriefSavedStatus(brief.id)
      .then((res) => {
        if (!isCancelled) setIsSaved(Boolean(res?.is_saved));
      })
      .catch(() => null);

    api.getContextualConversation({ brief_id: brief.id })
      .then((res) => {
        if (!isCancelled && res) {
          setContextualStatus(res);
        }
      })
      .catch(() => null);

    return () => {
      isCancelled = true;
    };
  }, [brief?.id, isCreatorUser]);

  // Load matches
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

  const handleToggleSave = async () => {
    if (!isCreatorUser) {
      alert('Sign in as a Creator to save briefs to your bookmarks.');
      return;
    }
    try {
      setIsSaving(true);
      if (isSaved) {
        await api.unsaveBrief(brief.id);
        setIsSaved(false);
      } else {
        await api.saveBrief(brief.id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark on brief:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatWithBrand = async () => {
    if (!activeUser) {
      alert('Sign in as a Creator to chat with the brand.');
      return;
    }
    if (activeUser.role?.toUpperCase() !== 'CREATOR') {
      alert('Brand-to-brand messaging is not supported.');
      return;
    }
    try {
      setIsCheckingChat(true);
      setChatIneligibleNotice(null);
      const res = await api.getContextualConversation({ brief_id: brief.id });
      setContextualStatus(res);

      if (res?.status === 'found' && res.conversation) {
        if (onOpenChat) {
          onOpenChat({
            conversationId: res.conversation.id,
            briefId: brief.id,
            brandId: brief.brand_id,
            brandName: brandName,
          });
        } else {
          onClose();
        }
      } else {
        setChatIneligibleNotice({
          reason:
            res?.reason ||
            `Direct messaging with ${brandName} unlocks once your application pitch or invitation is accepted for this campaign.`,
          requiredAction: res?.required_action,
          invitationId: res?.invitation_id,
          applicationStatus: res?.application_status,
        });
      }
    } catch (err) {
      console.error('Error starting chat with brand:', err);
      setChatIneligibleNotice({
        reason: err.message || 'Unable to open brand discussion.',
        requiredAction: 'APPLY',
      });
    } finally {
      setIsCheckingChat(false);
    }
  };

  const handleAcceptInvitationAndChat = async (invId) => {
    const targetInvId = invId || contextualStatus?.invitation_id;
    if (!targetInvId) {
      alert('Invitation ID not found.');
      return;
    }
    try {
      setIsAcceptingInvite(true);
      await api.acceptInvitation(targetInvId);
      // Fetch conversation after acceptance
      const res = await api.getContextualConversation({ brief_id: brief.id });
      if (res?.status === 'found' && res.conversation) {
        if (onOpenChat) {
          onOpenChat({
            conversationId: res.conversation.id,
            briefId: brief.id,
            brandId: brief.brand_id,
            brandName: brandName,
          });
        } else {
          onClose();
        }
      } else {
        setContextualStatus(res);
        setChatIneligibleNotice(null);
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const scrollToApply = () => {
    setChatIneligibleNotice(null);
    const el = document.querySelector('.apply-textarea') || document.querySelector('.application-section');
    if (el) {
      el.focus?.();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
      // Refresh contextual status
      api.getContextualConversation({ brief_id: brief.id })
        .then((res) => setContextualStatus(res))
        .catch(() => null);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleAiAssistPitch = async () => {
    if (!isCreatorUser) return;
    try {
      setIsDraftingPitch(true);
      setApplyError(null);
      const res = await api.assistPitch(brief.id, {
        custom_notes: pitchText?.trim() || undefined,
      });
      if (res?.pitch_text) {
        setPitchText(res.pitch_text);
        if (res.proposed_rate) {
          setProposedRate(res.proposed_rate);
        }
        setPitchDraftedEngine(res.generation_engine || 'Grounded Assistant');
      }
    } catch (err) {
      console.error('Error drafting pitch with AI:', err);
      setApplyError('Failed to formulate proposal: ' + (err.message || 'Error'));
    } finally {
      setIsDraftingPitch(false);
    }
  };

  const refUrl = brief.reference_asset_url || brief.cover_image_url;
  const isBrandUpload =
    refUrl &&
    !refUrl.startsWith('/assets/campaign-covers/') &&
    (refUrl.startsWith('/uploads/') ||
      refUrl.startsWith('http://') ||
      refUrl.startsWith('https://') ||
      refUrl.startsWith('data:'));
  const isDocumentRef =
    refUrl &&
    (refUrl.endsWith('.pdf') ||
      refUrl.endsWith('.docx') ||
      refUrl.endsWith('.doc') ||
      refUrl.endsWith('.txt'));
  const displayVisualUrl = getBriefCoverImage(brief);

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
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Creator-facing Main Brief Action Area (Never shown to Brand users) */}
        {isCreatorUser && (
          <div
            className="creator-brief-action-bar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 24px',
              backgroundColor: '#FAF8F5',
              borderBottom: '1px solid #EAE6DF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Primary "Chat with Brand" Button */}
              <button
                type="button"
                id="btn-chat-with-brand"
                className="btn-chat-with-brand"
                onClick={handleChatWithBrand}
                disabled={isCheckingChat || isAcceptingInvite}
                style={{
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: isCheckingChat ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(121, 82, 236, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>💬</span>
                <span>{isCheckingChat ? 'Opening Discussion...' : `Chat with ${brandName}`}</span>
              </button>

              {/* Save Brief Button */}
              <button
                type="button"
                id="btn-save-brief-modal"
                onClick={handleToggleSave}
                disabled={isSaving}
                style={{
                  backgroundColor: isSaved ? '#ECE6FC' : '#FFFFFF',
                  color: isSaved ? '#7952EC' : '#444444',
                  border: isSaved ? '1.5px solid #7952EC' : '1.5px solid #D6D0C4',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isSaving ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{isSaved ? '♥' : '🔖'}</span>
                <span>{isSaved ? 'Saved Brief' : 'Save Brief'}</span>
              </button>

              {/* Contextual Action / Status Indicator */}
              {(contextualStatus?.invitation_id || contextualStatus?.required_action === 'ACCEPT_INVITATION') ? (
                <button
                  type="button"
                  id="btn-accept-invitation-modal"
                  onClick={() => handleAcceptInvitationAndChat(contextualStatus?.invitation_id)}
                  disabled={isAcceptingInvite}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isAcceptingInvite ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <span>✉️</span>
                  <span>{isAcceptingInvite ? 'Unlocking Workspace...' : 'Accept Invitation & Unlock Chat 🚀'}</span>
                </button>
              ) : contextualStatus?.status === 'found' ? (
                <span
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✓</span>
                  <span>Active Collaboration Thread</span>
                </span>
              ) : contextualStatus?.application_status === 'PENDING' ? (
                <span
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⏳</span>
                  <span>Pitch Under Review</span>
                </span>
              ) : (
                <button
                  type="button"
                  id="btn-quick-apply"
                  onClick={scrollToApply}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#7952EC',
                    border: '1.5px solid #7952EC',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📝</span>
                  <span>Apply / Submit Pitch</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase' }}>
                Brand:
              </span>
              <BrandLogo brand={brief.brand} brandName={brandName} size={24} shape="rounded" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>
                {brandName}
              </span>
            </div>
          </div>
        )}

        {/* Ineligible Explanation Notice Banner */}
        {chatIneligibleNotice && (
          <div
            style={{
              backgroundColor: '#F5F3FF',
              borderBottom: '1px solid #DDD6FE',
              padding: '12px 24px',
              fontSize: '13px',
              color: '#4C1D95',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <span style={{ lineHeight: 1.4, fontWeight: '500' }}>{chatIneligibleNotice.reason}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {chatIneligibleNotice.invitationId || chatIneligibleNotice.requiredAction === 'ACCEPT_INVITATION' ? (
                <button
                  type="button"
                  onClick={() =>
                    handleAcceptInvitationAndChat(
                      chatIneligibleNotice.invitationId || contextualStatus?.invitation_id
                    )
                  }
                  disabled={isAcceptingInvite}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isAcceptingInvite ? 'wait' : 'pointer',
                  }}
                >
                  {isAcceptingInvite ? 'Accepting...' : 'Accept Invitation & Unlock Chat 🚀'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={scrollToApply}
                  style={{
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
                  Submit Application Pitch →
                </button>
              )}
              <button
                type="button"
                onClick={() => setChatIneligibleNotice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6D28D9',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px',
                }}
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="brief-modal-content-grid">
          {/* Left: Brief Specifications */}
          <div className="brief-spec-col">
            <div className="budget-highlight-card glass-panel">
              <div className="budget-meta">
                <span className="budget-label">CAMPAIGN BUDGET</span>
                <span className="budget-amount">${brief.budget_amount?.toLocaleString()} {brief.budget_currency || 'USD'}</span>
              </div>
              <div className="budget-brand" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <span className="brand-label">BRAND</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <BrandLogo brand={brief.brand} brandName={brandName} size={28} shape="rounded" />
                    <span className="brand-name" style={{ fontSize: '15px', fontWeight: '700' }}>{brandName}</span>
                  </div>
                </div>
                {isCreatorUser && (
                  <button
                    type="button"
                    className="btn-chat-with-brand"
                    onClick={handleChatWithBrand}
                    disabled={isCheckingChat}
                    style={{
                      marginTop: '4px',
                      backgroundColor: '#FAF8F5',
                      color: '#7952EC',
                      border: '1.5px solid #7952EC',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: isCheckingChat ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      alignSelf: 'flex-start',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isCheckingChat ? 'Opening...' : `💬 Chat with ${brandName}`}
                  </button>
                )}
              </div>
            </div>

            {/* Reference Asset & Moodboard Showcase */}
            <div className="spec-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ margin: 0 }}>
                  {isBrandUpload ? 'CAMPAIGN REFERENCE ASSET (BRAND UPLOAD)' : 'CAMPAIGN KEY VISUAL'}
                </h4>
                {isBrandUpload ? (
                  <span style={{ fontSize: '11px', background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    Verified Reference
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    Curated Domain Visual
                  </span>
                )}
              </div>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #EAE6DF', background: '#F8F6F0', maxHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <img
                  src={displayVisualUrl}
                  alt={brief.title}
                  style={{ width: '100%', height: '100%', maxHeight: '240px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/campaign-covers/brand_skincare_cover.jpg';
                  }}
                />
              </div>
              {isDocumentRef && (
                <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: '#FFF', border: '1px solid #EAE6DF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#333', fontWeight: '600' }}>
                    📎 Attached Brief Document / Spec
                  </span>
                  <a
                    href={refUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', backgroundColor: '#7952EC', color: '#FFF' }}
                  >
                    Open Asset ↗
                  </a>
                </div>
              )}
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

            {/* Creator Application Pitch Section (Guarded against Brand Self-Pitch) */}
            {isBrandOwner || isBrandUser ? (
              <div className="application-section glass-panel" style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#111', margin: '0 0 4px 0' }}>CAMPAIGN BRIEF DESK</h4>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>
                  You are viewing this brief from the Brand Portal. Review recommended creators on the right or invite specific creators directly.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: '#ECE6FC', color: '#7952EC', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                    Status: {brief.status}
                  </span>
                  <span className="badge" style={{ background: '#F0ECE4', color: '#555', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                    Budget: ${brief.budget_amount?.toLocaleString()} {brief.budget_currency || 'USD'}
                  </span>
                </div>
              </div>
            ) : isCreatorUser ? (
              <div className="application-section glass-panel">
                <h4>SUBMIT APPLICATION PITCH</h4>
                {applySuccess ? (
                  <div className="alert-success" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>✓ Application pitch successfully submitted to brand! Engagement pending review.</div>
                    <div style={{ fontSize: '12px', color: '#047857', lineHeight: 1.5 }}>
                      Once {brandName} reviews and accepts your proposal, direct messaging will unlock automatically.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="apply-form">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <label className="label-form" style={{ margin: 0 }}>
                        Proposal Pitch & Creative Approach:
                      </label>
                      <button
                        type="button"
                        onClick={handleAiAssistPitch}
                        disabled={isDraftingPitch}
                        className="btn-ai-assist"
                      >
                        {isDraftingPitch ? 'Formulating Pitch...' : '✨ Assist Pitch with AI'}
                      </button>
                    </div>

                    {pitchDraftedEngine && (
                      <div style={{ fontSize: '11px', color: '#047857', marginBottom: '8px', backgroundColor: '#ECFDF5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', lineHeight: 1.4 }}>
                        ✓ Grounded pitch drafted from your verified portfolio and tools ({pitchDraftedEngine}). Review and edit before submitting.
                      </div>
                    )}

                    <textarea
                      rows={5}
                      placeholder="Explain your creative approach, tools (Runway, ComfyUI, Midjourney), and portfolio relevance..."
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
                          min="100"
                          step="50"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn-chat-pill"
                          onClick={handleChatWithBrand}
                          disabled={isCheckingChat}
                        >
                          💬 Chat with Brand
                        </button>
                        <button type="submit" className="btn btn-dark btn-sm" disabled={submittingApply}>
                          {submittingApply ? 'Submitting...' : 'Submit Pitch →'}
                        </button>
                      </div>
                    </div>
                    {applyError && <p className="banner-error mt-2">{applyError}</p>}
                  </form>
                )}
              </div>
            ) : (
              <div className="application-section glass-panel" style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Log in as a verified Creator to submit an application pitch for this campaign brief.
                </p>
              </div>
            )}
          </div>

          {/* Right: Proof-to-Brief Matching Engine */}
          <div className="brief-matching-col">
            <div className="matching-header-box">
              <div className="matching-header-title">
                <span className="spark-icon">⚡</span>
                <h3>Proof-to-Brief Matching Engine</h3>
              </div>
              <p className="matching-header-sub">
                Deterministic ranking based on verified portfolio evidence, skill mastery, tool stacks, and commercial rates.
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
                {matches.slice(0, 5).map((m, idx) => (
                  <div
                    key={m.creator_id || idx}
                    className="match-card glass-panel"
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      border: '1px solid rgba(121, 82, 236, 0.2)',
                    }}
                    onClick={() => {
                      if (onSelectCreator) {
                        onSelectCreator({
                          id: m.creator_id,
                          display_name: m.display_name,
                          handle: m.handle,
                          avatar_url: m.avatar_url,
                        });
                      }
                    }}
                  >
                    <div className="match-card-top">
                      <img
                        src={getCreatorAvatar(m)}
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
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/avatars/elena.jpg';
                        }}
                      />
                      <div className="match-meta">
                        <div className="match-name-row">
                          <strong>{m.display_name}</strong>
                          <span className="badge badge-top-studio">{m.verification_tier || 'TOP STUDIO'}</span>
                        </div>
                        <span className="match-handle">@{m.handle} • ${m.min_budget}/brief</span>
                      </div>
                      <div className="match-score-badge">
                        <span className="score-num">{m.score.toFixed(1)}%</span>
                        <span className="score-lbl">{m.match_level}</span>
                      </div>
                    </div>

                    {/* Data Coverage Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 6px 0' }}>
                      <span style={{ fontSize: '10px', color: '#6A45DB', backgroundColor: '#F4F2FF', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                        ✦ {Math.round(m.data_coverage || 100)}% Data Coverage
                      </span>
                      {m.breakdown && (
                        <span style={{ fontSize: '10px', color: '#666' }}>
                          Skill {Math.round(m.breakdown.skill_score)}% • Tool {Math.round(m.breakdown.tool_score)}% • Fit {Math.round(m.breakdown.budget_score || 100)}%
                        </span>
                      )}
                    </div>

                    {/* Reasons */}
                    <div className="match-reasons-list">
                      {m.reasons && m.reasons.slice(0, 3).map((r, rIdx) => (
                        <div key={rIdx} className="match-reason-item">
                          <span className="reason-check">✓</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Relevant Portfolio Project Reference */}
                    {m.relevant_portfolio_projects && m.relevant_portfolio_projects.length > 0 && (
                      <div style={{ margin: '6px 0', padding: '6px 8px', borderRadius: '6px', backgroundColor: '#FAF8F5', border: '1px solid #EAE6DF', fontSize: '11px', color: '#444' }}>
                        <span style={{ fontWeight: '700', color: '#7952EC', marginRight: '4px' }}>📁 Proven Deliverable:</span>
                        <span>{m.relevant_portfolio_projects[0].title}</span>
                      </div>
                    )}

                    {/* Gaps / Warnings if present */}
                    {m.gaps && m.gaps.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#B45309', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>⚠️</span>
                        <span className="line-clamp-1">{m.gaps[0]}</span>
                      </div>
                    )}

                    {/* Matched Tools & View Profile Action */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="match-tools-strip">
                        {m.matched_tools && m.matched_tools.slice(0, 3).map((t) => (
                          <span key={t} className="tag-pill match-tool-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-chat-matched-creator"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenChat) {
                              onOpenChat({
                                creatorId: m.creator_id,
                                briefId: brief.id,
                                creatorName: m.display_name,
                              });
                            }
                          }}
                          style={{
                            backgroundColor: '#FAF8F5',
                            border: '1px solid #7952EC',
                            borderRadius: '6px',
                            color: '#7952EC',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          💬 Chat
                        </button>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#7952EC' }}>
                          View Profile →
                        </span>
                      </div>
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
