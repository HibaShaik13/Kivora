import React, { useMemo } from 'react';

export default function AdminAuditLogView({
  requests = null,
  isLoading = false,
  error = null,
  onRetry,
  onAdminLogin,
}) {
  // Extract real recorded reviews from existing database verification records
  const realAuditRecords = useMemo(() => {
    if (!requests) return [];
    return requests
      .filter((r) => r.reviewed_by && r.reviewed_by !== 'PENDING_AUDIT')
      .map((r) => ({
        id: r.id,
        timestamp: r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : 'N/A',
        actor: r.reviewed_by,
        action: `VERIFICATION_${r.status}`,
        target: `${r.creator_name || 'Creator'} (@${r.creator_handle || 'unknown'})`,
        scope: r.verification_scope,
        notes: r.reviewer_notes || 'No review rationale logged.',
        status: r.status,
      }));
  }, [requests]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. EXPLANATORY NOTICE BOX */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(121, 82, 236, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E0B38', fontWeight: '800', fontSize: '15px' }}>
          <span>📋</span>
          <span>Administrative Audit Trail System</span>
        </div>
        <p style={{ fontSize: '12px', color: '#4B5563', margin: 0, lineHeight: 1.6 }}>
          <strong>Phase 1 Audit Notice:</strong> Kivora's full event-sourced administrative audit logging system (tracking administrative logins, role modifications, brief overrides, and dispute resolutions) is scheduled for implementation in Phase 2.
        </p>
        <div style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '10px 14px', fontSize: '11.5px', color: '#6B21A8' }}>
          Currently displayed below are <strong>live, verified administrative decisions</strong> persisted within the active <code>verification_records</code> database table. No fictitious logs or mock events are displayed.
        </div>
      </div>

      {/* 2. REAL VERIFICATION REVIEWS AUDIT TRAIL */}
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
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
              Recorded Verification Decisions
            </h3>
            <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
              Historical review events recorded in database ({realAuditRecords.length} entries)
            </div>
          </div>
        </div>

        {isLoading && requests === null ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', fontSize: '12.5px' }}>
            Loading recorded verification audit events from database...
          </div>
        ) : error && requests === null ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#991B1B', fontSize: '12.5px' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px' }}>
              Failed to load verification decisions from server
            </div>
            <div style={{ fontSize: '11.5px', color: '#6B7280', marginBottom: '14px' }}>{error}</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {onAdminLogin && (
                <button
                  type="button"
                  onClick={onAdminLogin}
                  style={{
                    backgroundColor: '#7952EC',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
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
                    padding: '6px 14px',
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
        ) : realAuditRecords.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: '12.5px' }}>
            No administrative verification decisions recorded in the database yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Reviewer (Admin)</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Action</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Target Creator & Scope</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Logged Decision Rationale</th>
                </tr>
              </thead>
              <tbody>
                {realAuditRecords.map((record) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {record.timestamp}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E0B38' }}>
                      {record.actor}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          backgroundColor: record.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2',
                          color: record.status === 'APPROVED' ? '#065F46' : '#991B1B',
                        }}
                      >
                        {record.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1E0B38' }}>{record.target}</div>
                      <div style={{ fontSize: '10.5px', color: '#6B7280' }}>{record.scope}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151', maxWidth: '300px' }}>
                      {record.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
