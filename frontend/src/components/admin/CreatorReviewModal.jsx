import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { getCreatorAvatar } from '../../utils/visualAssetHelpers';
import { formatINR, clampDemoBudget } from '../../utils/indianLocalization';

export default function CreatorReviewModal({
  creator,
  isOpen,
  onClose,
  onApprovalUpdated,
}) {
  const [fullProfile, setFullProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null); // 'APPROVE' | 'REJECT' | null
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (creator && isOpen) {
      setIsLoading(true);
      setError(null);
      setActionType(null);
      setRejectionReason('');
      setAdminNotes('');

      api
        .getCreator(creator.handle || creator.creator_id || creator.id)
        .then((data) => {
          if (isMounted) {
            setFullProfile(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message || 'Failed to load full creator profile.');
            setIsLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [creator, isOpen]);

  if (!isOpen || !creator) return null;

  const currentStatus = fullProfile?.approval_status || creator.approval_status || 'PENDING';
  const portfolioProjects = fullProfile?.portfolio_projects || [];

  const formatErrorMessage = (err, defaultMsg) => {
    if (err?.status === 503 || (err?.message && err.message.toLowerCase().includes('migration'))) {
      return "Database Schema Migration Required (HTTP 503): This creator approval decision could not be saved because the active database schema requires migration (pending Alembic revision '8f2c3b4a5d6e'). No changes were saved to the database.";
    }
    if (err?.status === 401 || err?.status === 403) {
      return "Access Denied: Only authorized platform administrators can approve or reject creator profiles.";
    }
    return err?.message || defaultMsg;
  };

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve ${creator.display_name || 'this creator'}? Full marketplace access will be unlocked immediately.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await api.reviewCreatorApprovalAdmin(creator.creator_id || creator.id, {
        approval_status: 'APPROVED',
        reviewer_notes: adminNotes.trim() || undefined,
      });
      if (onApprovalUpdated) onApprovalUpdated(updated);
      onClose();
    } catch (err) {
      setError(formatErrorMessage(err, 'Failed to approve creator.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrandfather = async () => {
    if (!window.confirm(`Are you sure you want to grant legacy active status to ${creator.display_name || 'this creator'}? They will have marketplace access under grandfathered legacy rules.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await api.reviewCreatorApprovalAdmin(creator.creator_id || creator.id, {
        approval_status: 'LEGACY_ACTIVE',
        reviewer_notes: adminNotes.trim() || 'Grandfathered active legacy creator',
      });
      if (onApprovalUpdated) onApprovalUpdated(updated);
      onClose();
    } catch (err) {
      setError(formatErrorMessage(err, 'Failed to grant legacy active status.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('A mandatory, non-empty reviewer note is required when rejecting a creator profile.');
      return;
    }

    if (!window.confirm(`Are you sure you want to request revisions from ${creator.display_name || 'this creator'}?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await api.reviewCreatorApprovalAdmin(creator.creator_id || creator.id, {
        approval_status: 'REJECTED',
        reviewer_notes: rejectionReason.trim(),
      });
      if (onApprovalUpdated) onApprovalUpdated(updated);
      onClose();
    } catch (err) {
      setError(formatErrorMessage(err, 'Failed to reject creator.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF5FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={getCreatorAvatar(fullProfile || creator)}
              alt={creator.display_name}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #EDE9FE' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/creator-portraits/devon.jpg';
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
                  {creator.display_name}
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor:
                      currentStatus === 'APPROVED'
                        ? '#DCFCE7'
                        : currentStatus === 'REJECTED'
                        ? '#FEE2E2'
                        : currentStatus === 'LEGACY_ACTIVE'
                        ? '#EDE9FE'
                        : '#FEF3C7',
                    color:
                      currentStatus === 'APPROVED'
                        ? '#166534'
                        : currentStatus === 'REJECTED'
                        ? '#991B1B'
                        : currentStatus === 'LEGACY_ACTIVE'
                        ? '#5B21B6'
                        : '#92400E',
                  }}
                >
                  ● {currentStatus}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                @{creator.handle} • {fullProfile?.primary_specialization || 'Generative Creator'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: '#9CA3AF',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '500',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
              Loading creator portfolio and profile details...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Overview Card */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid #F3F4F6',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#7952EC', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Professional Bio &amp; Identity
                </div>
                <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', margin: '0 0 10px' }}>
                  {fullProfile?.bio || 'No biography entered.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', color: '#4B5563' }}>
                  <div>📍 Location: <strong>{fullProfile?.location || 'Remote'}</strong></div>
                  <div>⏳ Experience: <strong>{fullProfile?.years_experience || 1} yrs</strong></div>
                  <div>💰 Min Budget: <strong>{formatINR(clampDemoBudget(fullProfile?.min_budget, 25000))}</strong></div>
                </div>
              </div>

              {/* Skills & Tools */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E0B38', marginBottom: '6px' }}>
                  Skills &amp; AI Generation Tools
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(fullProfile?.tools || []).map((t) => (
                    <span
                      key={t.tool_id || t.name}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#EDE9FE',
                        color: '#6D28D9',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      🛠️ {t.name}
                    </span>
                  ))}
                  {(fullProfile?.skills || []).map((s) => (
                    <span
                      key={s.skill_id || s.name}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      ✦ {s.name}
                    </span>
                  ))}
                  {(fullProfile?.tools || []).length === 0 && (fullProfile?.skills || []).length === 0 && (
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>No tools or skills linked yet.</span>
                  )}
                </div>
              </div>

              {/* Portfolio Works */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E0B38' }}>
                    Submitted Portfolio Works ({portfolioProjects.length})
                  </div>
                  {portfolioProjects.length === 0 && (
                    <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>
                      ⚠️ Zero portfolio works submitted
                    </span>
                  )}
                </div>

                {portfolioProjects.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '12px', color: '#6B7280', fontSize: '12.5px' }}>
                    No published projects found for this creator profile.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {portfolioProjects.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #E5E7EB',
                          overflow: 'hidden',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <div style={{ height: '110px', backgroundColor: '#EDE9FE' }}>
                          <img
                            src={p.thumbnail_url || p.primary_asset_url || '/assets/campaign-covers/brand_skincare_cover.jpg'}
                            alt={p.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/campaign-covers/brand_fashion_cover.jpg';
                            }}
                          />
                        </div>
                        <div style={{ padding: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '2px', lineHeight: '1.3' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#6B7280' }}>
                            {p.content_type || 'VIDEO'} • {p.aspect_ratio || '16:9'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Form (Approve or Reject mode) */}
              {actionType === 'REJECT' && (
                <form
                  onSubmit={handleReject}
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B' }}>
                    Request Profile Revisions / Reject Submission
                  </div>
                  <p style={{ fontSize: '12px', color: '#7F1D1D', margin: 0 }}>
                    Please provide detailed, constructive instructions. The creator will view this feedback directly on their dashboard and will be allowed to update and resubmit.
                  </p>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Please provide at least two commercial portfolio video samples and attach prompt/workflow evidence to support your claims..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #F87171',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#FFFFFF',
                        color: '#4B5563',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !rejectionReason.trim()}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSubmitting ? 'Submitting Rejection...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAFA',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#4B5563',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Close
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {actionType !== 'REJECT' && (
              <>
                <button
                  type="button"
                  onClick={handleGrandfather}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid #DDD0F7',
                    backgroundColor: '#FAF5FF',
                    color: '#6D28D9',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                  title="Grant grandfathered legacy active access without individual approval tag"
                >
                  {isSubmitting ? 'Saving...' : 'Grant Legacy Active'}
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('REJECT')}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Request Changes / Reject
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  {isSubmitting ? 'Approving...' : '✓ Approve Creator Account'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
