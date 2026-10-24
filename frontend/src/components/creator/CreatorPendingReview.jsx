import React, { useState } from 'react';
import { api } from '../../services/api';

export default function CreatorPendingReview({
  currentUser,
  approvalData,
  onRefreshStatus,
  onLogout,
  onEditProfile,
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckMessage(null);
    try {
      if (onRefreshStatus) {
        await onRefreshStatus();
      } else {
        await api.getMyApprovalStatus();
      }
      setCheckMessage('Status refreshed: Your creator profile is currently under review.');
    } catch (err) {
      setCheckMessage(err.message || 'Failed to refresh status.');
    } finally {
      setIsChecking(false);
      setTimeout(() => setCheckMessage(null), 4000);
    }
  };

  const submittedAtFormatted = approvalData?.submitted_at
    ? new Date(approvalData.submitted_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent submission';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', padding: '2.5rem 1rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>✦</span>
            <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.08em', color: '#7952EC', textTransform: 'uppercase' }}>
              Kivora Creator Studio
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: '#FFFFFF',
              color: '#6B7280',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Main Status Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid rgba(121, 82, 236, 0.14)',
            boxShadow: '0 12px 36px rgba(121, 82, 236, 0.05)',
            padding: '2.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {/* Animated Hourglass / Clock Badge */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              backgroundColor: '#EDE9FE',
              color: '#6D28D9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 16px rgba(109, 40, 217, 0.15)',
            }}
          >
            ⏳
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '999px',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontSize: '11.5px',
              fontWeight: '800',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            ● Pending Review
          </span>

          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1E0B38', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Your creator profile is under review
          </h1>

          <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '520px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            Your portfolio has been submitted successfully. Our team will review your creator profile and update your status when a decision is made.
          </p>

          {/* 4-Step Status Tracker */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              textAlign: 'left',
              padding: '1.25rem',
              borderRadius: '16px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #F3F4F6',
              marginBottom: '2rem',
            }}
          >
            {/* Step 1 */}
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#059669', marginBottom: '2px' }}>
                ✓ COMPLETE
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Account Created</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Registered role</div>
            </div>

            {/* Step 2 */}
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#059669', marginBottom: '2px' }}>
                ✓ VERIFIED
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Email Confirmed</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>6-digit OTP</div>
            </div>

            {/* Step 3 */}
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#059669', marginBottom: '2px' }}>
                ✓ SUBMITTED
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Portfolio Work</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                {approvalData?.portfolio_count || 1} project{approvalData?.portfolio_count !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Step 4 */}
            <div style={{ padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', marginBottom: '2px' }}>
                ● IN PROGRESS
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Admin Audit</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Review board</div>
            </div>
          </div>

          {/* Submission Info Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#EDE9FE',
              color: '#5B21B6',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '1.5rem',
            }}
          >
            <span>Submitted: <strong>{submittedAtFormatted}</strong></span>
            <span>Account: <strong>{currentUser?.email}</strong></span>
          </div>

          {/* Check Status Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={isChecking}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                backgroundColor: '#7952EC',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                border: 'none',
                cursor: isChecking ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(121, 82, 236, 0.25)',
              }}
            >
              {isChecking ? 'Checking Board Status...' : 'Check Approval Status ⟳'}
            </button>

            {onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                View & Edit Profile ✎
              </button>
            )}
          </div>

          {checkMessage && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#6D28D9', fontWeight: '600' }}>
              {checkMessage}
            </div>
          )}
        </div>

        {/* Feature Lock Notice */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🔒</span>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
              Marketplace Feature Permissions
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Permitted */}
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534', marginBottom: '4px' }}>
                PERMITTED WHILE PENDING
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#15803D', lineHeight: '1.6' }}>
                <li>View & update personal profile information</li>
                <li>View submitted portfolio projects and evidence</li>
                <li>Check live approval status and review notifications</li>
                <li>Account settings and security management</li>
              </ul>
            </div>

            {/* Locked */}
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#991B1B', marginBottom: '4px' }}>
                LOCKED UNTIL APPROVED
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#B91C1C', lineHeight: '1.6' }}>
                <li>Submitting proposals or applying to brand briefs</li>
                <li>AI Pitch Assist and direct brand messaging</li>
                <li>Accepting contracts or submitting deliverables</li>
                <li>Public creator directory index placement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
