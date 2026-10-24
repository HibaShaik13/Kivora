import React, { useMemo } from 'react';

export default function AdminReportsView({
  requests = null,
  isLoading = false,
  error = null,
  totalCount = 0,
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
  auditedCount = 0,
  onRetry,
  onAdminLogin,
}) {
  // Calculated live metrics
  const decidedCount = approvedCount + rejectedCount;
  const approvalRate = decidedCount > 0 ? ((approvedCount / decidedCount) * 100).toFixed(1) : '0.0';
  const rejectionRate = decidedCount > 0 ? ((rejectedCount / decidedCount) * 100).toFixed(1) : '0.0';
  const backlogRatio = totalCount > 0 ? ((pendingCount / totalCount) * 100).toFixed(1) : '0.0';
  const aiCoverage = totalCount > 0 ? ((auditedCount / totalCount) * 100).toFixed(1) : '0.0';

  // Helper for metrics
  const renderRate = (val, color = '#1E0B38') => {
    if (isLoading && requests === null) {
      return (
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#9CA3AF', marginTop: '4px' }}>
          ...
        </div>
      );
    }
    if (error && requests === null) {
      return (
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#9CA3AF', marginTop: '4px' }} title={error}>
          —
        </div>
      );
    }
    return (
      <div style={{ fontSize: '26px', fontWeight: '800', color, marginTop: '4px' }}>
        {val}%
      </div>
    );
  };

  // Scope distribution
  const scopeBreakdown = useMemo(() => {
    if (!requests) return [];
    const map = {};
    for (const r of requests) {
      const scope = r.verification_scope || 'General Verification';
      map[scope] = (map[scope] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  // Export current data as JSON
  const handleExportJson = () => {
    if (!requests || requests.length === 0) return;
    const reportData = {
      generated_at: new Date().toISOString(),
      report_title: 'Kivora Verification & Trust Performance Audit',
      summary_kpis: {
        total_requests: totalCount,
        approved_claims: approvedCount,
        rejected_claims: rejectedCount,
        pending_backlog: pendingCount,
        ai_audits_performed: auditedCount,
        approval_rate_percent: Number(approvalRate),
        ai_coverage_percent: Number(aiCoverage),
      },
      verification_records: requests.map((r) => ({
        id: r.id,
        creator_name: r.creator_name,
        creator_handle: r.creator_handle,
        verification_scope: r.verification_scope,
        status: r.status,
        reviewed_by: r.reviewed_by,
        reviewer_notes: r.reviewer_notes,
        reviewed_at: r.reviewed_at,
        has_ai_analysis: Boolean(r.ai_analysis),
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kivora_verification_report_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ERROR BANNER IF DATA LOAD FAILED */}
      {error && requests === null && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#991B1B',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <strong>Unable to compute analytics:</strong> {error}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
        </div>
      )}

      {/* 1. HEADER WITH EXPORT ACTION */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(121, 82, 236, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
            Platform Reports & Verification Analytics
          </h2>
          <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
            Reliable metrics calculated live from active database records
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          disabled={!requests || requests.length === 0}
          style={{
            backgroundColor: !requests || requests.length === 0 ? '#F3F4F6' : '#EDE9FE',
            color: !requests || requests.length === 0 ? '#9CA3AF' : '#6D28D9',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: !requests || requests.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>📥</span>
          <span>Export Audit Report (JSON)</span>
        </button>
      </div>

      {/* 2. LIVE CALCULATED METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Audit Approval Rate</div>
          {renderRate(approvalRate, '#065F46')}
          <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>
            {requests !== null ? `${approvedCount} of ${decidedCount} reviewed` : 'Awaiting data'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Rejection Rate</div>
          {renderRate(rejectionRate, '#991B1B')}
          <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>
            {requests !== null ? `${rejectedCount} claims unverified` : 'Awaiting data'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Pending Backlog Ratio</div>
          {renderRate(backlogRatio, '#D97706')}
          <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>
            {requests !== null ? `${pendingCount} of ${totalCount} total queue` : 'Awaiting data'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>AI Audit Coverage</div>
          {renderRate(aiCoverage, '#4C1D95')}
          <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>
            {requests !== null ? `${auditedCount} requests assisted` : 'Awaiting data'}
          </div>
        </div>
      </div>

      {/* 3. VERIFICATION SCOPE DISTRIBUTION */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(121, 82, 236, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38', margin: '0 0 1rem' }}>
          Verification Scope Breakdown
        </h3>

        {scopeBreakdown.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>No scope data available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scopeBreakdown.map(([scope, count]) => {
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={scope}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#1E0B38' }}>{scope}</span>
                    <span style={{ color: '#6B7280' }}>{count} requests ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: '#7952EC',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. HONEST NOTICE FOR ADVANCED ANALYTICS (PHASE 2 ROADMAP) */}
      <div
        style={{
          backgroundColor: '#FAF5FF',
          borderRadius: '16px',
          border: '1px solid #E9D5FF',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D28D9', fontWeight: '700', fontSize: '13px' }}>
          <span>ℹ️</span>
          <span>Upcoming Phase 2 Reporting Modules</span>
        </div>
        <p style={{ fontSize: '12px', color: '#5B21B6', margin: 0, lineHeight: 1.5 }}>
          The metrics displayed above are computed directly from live <code>verification_records</code> in <code>kivora.db</code>.
          Advanced revenue GMV aggregation, milestone escrow transaction volume, and brand campaign demand heatmaps require dedicated report query tables and will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
}
