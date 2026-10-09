import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Sparkle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MagnifyingGlass,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { verificationApi } from '../api/verification';
import AdminAuditModal from '../components/dashboard/AdminAuditModal';

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRequestForAudit, setSelectedRequestForAudit] = useState(null);

  const fetchVerificationQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter === 'ALL' ? {} : { status: statusFilter };
      const data = await verificationApi.listRequestsAdmin(params);
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load admin verification queue:', err);
      setError(err.message || 'Failed to load verification review queue.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVerificationQueue();
  }, [fetchVerificationQueue]);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header Banner */}
        <div
          className="card"
          style={{
            padding: '32px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-lavender-subtle)',
                color: 'var(--accent-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={28} weight="fill" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>ADMIN WORKSPACE</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Verification Governance</span>
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
                Proof-of-Work Verification Desk
              </h1>
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '720px' }}>
            Audit creator workflow telemetry, run Gemini-assisted evidence analysis, and promote creators to Verified Pro or Top Studio tiers.
          </p>

          {/* Quick Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Pending Audits
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-coral)', marginTop: '2px' }}>
                {statusFilter === 'PENDING' ? requests.length : pendingCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Approved Claims
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2E7D32', marginTop: '2px' }}>
                {statusFilter === 'APPROVED' ? requests.length : approvedCount}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Rejected Records
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '2px' }}>
                {statusFilter === 'REJECTED' ? requests.length : rejectedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Showing <strong>{requests.length}</strong> verification records
          </div>
        </div>

        {/* Queue Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading verification queue...</p>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--accent-coral-subtle)',
              borderRadius: '12px',
              color: 'var(--accent-coral)',
              border: '1px solid var(--accent-coral-border)',
            }}
          >
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
            <ShieldCheck size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
              No Claims Found
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              There are no verification requests currently matching the '{statusFilter}' status filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map((req) => (
              <div
                key={req.id}
                className="card"
                style={{
                  padding: '24px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px',
                }}
              >
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      className={`badge badge-${req.status === 'APPROVED' ? 'verified' : req.status === 'PENDING' ? 'coral' : 'neutral'}`}
                      style={{ fontSize: '0.6875rem' }}
                    >
                      {req.status}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      Target: {req.target_type}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: 800, fontFamily: 'var(--font-family-display)' }}>
                    {req.evidence_title || 'Evidence Attachment'}
                  </h3>

                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Creator: <strong>{req.creator_name || 'Creator'}</strong> (@{req.creator_handle}) • Project: {req.project_title || req.target_id}
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    Claim Scope: {req.verification_scope}
                  </div>

                  {req.ai_analysis && (
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--accent-lavender-subtle)',
                        color: 'var(--accent-lavender)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      <Sparkle size={14} weight="fill" />
                      <span>Gemini Analysis Ready</span>
                    </div>
                  )}
                </div>

                {/* Audit Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setSelectedRequestForAudit(req)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem', padding: '10px 20px' }}
                  >
                    <ShieldCheck size={16} />
                    <span>Audit Claim & Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Audit & AI Review Modal */}
      <AdminAuditModal
        isOpen={Boolean(selectedRequestForAudit)}
        request={selectedRequestForAudit}
        onClose={() => setSelectedRequestForAudit(null)}
        onSuccess={fetchVerificationQueue}
      />
    </div>
  );
}
