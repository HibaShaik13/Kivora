import React from 'react';

export default function AdminOverviewView({
  requests = null,
  isLoading = false,
  error = null,
  totalCount = 0,
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
  auditedCount = 0,
  onNavigateToRequests,
  onSelectRequest,
  onRetry,
  onAdminLogin,
}) {
  // Recent 5 requests for the dashboard summary
  const recentRequests = requests ? requests.slice(0, 5) : [];

  // Recent reviewed decisions (real records from DB)
  const recentDecisions = requests
    ? requests.filter((r) => r.reviewed_by && r.reviewed_by !== 'PENDING_AUDIT').slice(0, 4)
    : [];

  const approvalRate =
    approvedCount + rejectedCount > 0
      ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
      : 0;

  // Helper to distinguish unavailable/error state from genuine zero
  const renderMetric = (val, color = '#1E0B38') => {
    if (isLoading && requests === null) {
      return (
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#9CA3AF', marginTop: '2px' }}>
          ...
        </div>
      );
    }
    if (error && requests === null) {
      return (
        <div
          style={{ fontSize: '26px', fontWeight: '800', color: '#9CA3AF', marginTop: '2px' }}
          title={error}
        >
          —
        </div>
      );
    }
    return (
      <div style={{ fontSize: '26px', fontWeight: '800', color, marginTop: '2px' }}>
        {val}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. FOUR SUMMARY METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {/* Card 1: Pending Reviews */}
        <div
          onClick={() => onNavigateToRequests && onNavigateToRequests('PENDING')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
          title="Click to view pending verification requests"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EDE9FE',
                color: '#7952EC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              📄
            </div>
            <span style={{ fontSize: '13px', color: '#7952EC', fontWeight: '600' }}>View queue ›</span>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Pending Reviews</div>
            {renderMetric(pendingCount, '#1E0B38')}
            <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>Awaiting admin review</div>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div
          onClick={() => onNavigateToRequests && onNavigateToRequests('APPROVED')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
          title="Click to view approved verification requests"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#D1FAE5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ✓
            </div>
            <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>View approved ›</span>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Approved Claims</div>
            {renderMetric(approvedCount, '#065F46')}
            <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>Audited & verified creators</div>
          </div>
        </div>

        {/* Card 3: Rejected */}
        <div
          onClick={() => onNavigateToRequests && onNavigateToRequests('REJECTED')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
          title="Click to view rejected verification requests"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ✕
            </div>
            <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600' }}>View rejected ›</span>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Rejected Claims</div>
            {renderMetric(rejectedCount, '#991B1B')}
            <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>Insufficient evidence or flagged</div>
          </div>
        </div>

        {/* Card 4: AI Audits */}
        <div
          onClick={() => onNavigateToRequests && onNavigateToRequests('')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
          }}
          title="Click to view requests with Gemini AI audits"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EDE9FE',
                color: '#7952EC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ✦
            </div>
            <span style={{ fontSize: '13px', color: '#7952EC', fontWeight: '600' }}>
              All ({requests !== null ? totalCount : '—'}) ›
            </span>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>AI Audits Completed</div>
            {renderMetric(auditedCount, '#4C1D95')}
            <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>Assisted by Gemini vision engine</div>
          </div>
        </div>
      </div>

      {/* 2. MAIN DASHBOARD SPLIT: RECENT QUEUE + PLATFORM INTEGRITY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left Column: Recent Verification Queue */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
                Recent Verification Submissions
              </h2>
              <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                Showing latest requests from the active production database
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToRequests && onNavigateToRequests('')}
              style={{
                backgroundColor: '#EDE9FE',
                color: '#6D28D9',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Manage All ({requests !== null ? totalCount : '—'})</span>
              <span>→</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Creator</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Verification Scope</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>AI Audit</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && requests === null ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                      Loading verification queue from server...
                    </td>
                  </tr>
                ) : error && requests === null ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#991B1B' }}>
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>Failed to retrieve verification records</div>
                      <div style={{ fontSize: '11.5px', color: '#6B7280', marginBottom: '12px' }}>{error}</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {onAdminLogin && (
                          <button
                            type="button"
                            onClick={onAdminLogin}
                            style={{
                              backgroundColor: '#7952EC',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Sign in as Admin
                          </button>
                        )}
                        {onRetry && (
                          <button
                            type="button"
                            onClick={onRetry}
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#991B1B',
                              border: '1px solid #FCA5A5',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>
                      No verification requests found in database.
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((req) => (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#E9D5FF',
                              color: '#6B21A8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '11px',
                              flexShrink: 0,
                            }}
                          >
                            {req.creator_name ? req.creator_name.charAt(0) : 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1E0B38' }}>{req.creator_name}</div>
                            <div style={{ fontSize: '10.5px', color: '#6B7280' }}>@{req.creator_handle}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.verification_scope}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            backgroundColor:
                              req.status === 'APPROVED'
                                ? '#D1FAE5'
                                : req.status === 'REJECTED'
                                ? '#FEE2E2'
                                : '#FEF3C7',
                            color:
                              req.status === 'APPROVED'
                                ? '#065F46'
                                : req.status === 'REJECTED'
                                ? '#991B1B'
                                : '#92400E',
                          }}
                        >
                          {req.status === 'PENDING' ? 'Pending' : req.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {req.ai_analysis ? (
                          <span style={{ color: '#7952EC', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span>✦</span>
                            <span>Audited</span>
                          </span>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>Not Run</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectRequest) onSelectRequest(req);
                            if (onNavigateToRequests) onNavigateToRequests();
                          }}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #DDD0F7',
                            color: '#7952EC',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          Inspect ›
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Platform Activity & Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Platform Health Status Box */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(121, 82, 236, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>Platform Integrity</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Database Engine</span>
                <span style={{ fontWeight: '700', color: '#065F46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  SQLite (Online)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>API Service</span>
                <span style={{ fontWeight: '700', color: '#065F46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  FastAPI v1.0.0
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Gemini AI Model</span>
                <span style={{ fontWeight: '700', color: '#4C1D95' }}>gemini-2.5-flash</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Historical Approval Rate</span>
                <span style={{ fontWeight: '700', color: '#1E0B38' }}>{approvalRate}%</span>
              </div>
            </div>
          </div>

          {/* Recent Administrative Decisions */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(121, 82, 236, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E0B38' }}>Recent Verified Decisions</span>
              <span style={{ fontSize: '11px', color: '#7952EC', fontWeight: '600' }}>Live DB</span>
            </div>

            {recentDecisions.length === 0 ? (
              <div style={{ fontSize: '11.5px', color: '#9CA3AF', padding: '0.5rem 0' }}>
                No completed reviews recorded in database yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentDecisions.map((dec) => (
                  <div
                    key={dec.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#F9FAFB',
                      fontSize: '11.5px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#1E0B38' }}>{dec.creator_name}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          backgroundColor: dec.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2',
                          color: dec.status === 'APPROVED' ? '#065F46' : '#991B1B',
                        }}
                      >
                        {dec.status}
                      </span>
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dec.verification_scope}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '10px' }}>
                      Reviewer: {dec.reviewed_by}
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
