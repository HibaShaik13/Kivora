import React from 'react';

export default function CreatorRejectionView({
  currentUser,
  approvalData,
  onStartResubmission,
  onLogout,
}) {
  const rejectionReason =
    approvalData?.rejection_reason ||
    'Your creator profile submission requires updates to meet Kivora marketplace quality standards. Please review your portfolio and evidence.';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', padding: '2.5rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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

        {/* Main Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 12px 36px rgba(239, 68, 68, 0.05)',
            padding: '2.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {/* Badge icon */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '24px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              margin: '0 auto 1.5rem',
            }}
          >
            📋
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '999px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontSize: '11.5px',
              fontWeight: '800',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            ● Revision Requested
          </span>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E0B38', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Profile Updates Required Before Approval
          </h1>

          <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Hi {currentUser?.full_name || 'Creator'}, our administrator review team inspected your creator profile and portfolio. Before full platform access can be unlocked, the following adjustments are required.
          </p>

          {/* Feedback Reason Card */}
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FECACA',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              textAlign: 'left',
              marginBottom: '2rem',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#991B1B', textTransform: 'uppercase', marginBottom: '6px' }}>
              Reviewer Feedback & Instructions
            </div>
            <div style={{ fontSize: '13.5px', color: '#7F1D1D', lineHeight: '1.6', fontWeight: '500' }}>
              &ldquo;{rejectionReason}&rdquo;
            </div>
          </div>

          {/* Suggested Resolution Steps */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '2rem',
              border: '1px solid #F3F4F6',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E0B38', marginBottom: '8px' }}>
              How to Resolve and Resubmit:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#4B5563', lineHeight: '1.7' }}>
              <li>Update your professional bio or specialization to clearly reflect your generative workflow.</li>
              <li>Upload additional high-resolution portfolio works or replace existing media assets.</li>
              <li>Attach process evidence (prompts, workflow screenshots, project files) to support verification.</li>
              <li>Select &ldquo;Update &amp; Resubmit for Review&rdquo; when you are ready.</li>
            </ul>
          </div>

          {/* Action button */}
          <div>
            <button
              type="button"
              onClick={onStartResubmission}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                backgroundColor: '#7952EC',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(121, 82, 236, 0.3)',
              }}
            >
              Update Profile &amp; Resubmit for Review ✎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
