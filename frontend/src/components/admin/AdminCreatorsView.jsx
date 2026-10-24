import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { getCreatorAvatar } from '../../utils/visualAssetHelpers';
import CreatorReviewModal from './CreatorReviewModal';

export default function AdminCreatorsView({ onInspectCreatorVerifications }) {
  const [creators, setCreators] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [actionErrorMsg, setActionErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState(''); // '' | 'TOP_STUDIO' | 'VERIFIED_PRO' | 'COMMUNITY'
  const [availabilityFilter, setAvailabilityFilter] = useState(''); // '' | 'AVAILABLE' | 'BOOKED' | 'LIMITED'
  const [approvalFilter, setApprovalFilter] = useState(''); // '' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'LEGACY_ACTIVE'
  const [selectedCreatorModal, setSelectedCreatorModal] = useState(null);
  const [reviewingCreator, setReviewingCreator] = useState(null);

  const fetchCreators = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Connect to the Phase 03 admin approval queue endpoint
      const fetchFn = api.getAdminCreatorApprovalQueue || api.getAdminCreators;
      const data = await fetchFn();
      const normalized = (data || []).map((item) => ({
        ...item,
        id: item.creator_id || item.id,
      }));
      setCreators(normalized);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError('Access Denied: Administrative privileges are required to view the creator approval queue.');
      } else if (err.status === 503 || (err.message && err.message.toLowerCase().includes('migration'))) {
        setError("Database Schema Migration Required (HTTP 503): Backend requires migration '8f2c3b4a5d6e' for creator approval status. Active database schema remains untouched.");
      } else {
        setError(err.message || 'Failed to load creator approval queue.');
      }
      setCreators(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleApprovalUpdated = (updated) => {
    if (!updated) {
      fetchCreators();
      return;
    }
    const updatedId = updated.creator_id || updated.id;
    setCreators((prev) =>
      (prev || []).map((c) =>
        (c.id === updatedId || c.creator_id === updatedId) ? { ...c, ...updated, id: updatedId } : c
      )
    );
    setActionSuccessMsg(
      `Successfully updated approval status for @${updated.handle || updated.display_name} to ${updated.approval_status}.`
    );
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const filteredCreators = useMemo(() => {
    if (!creators) return [];
    return creators.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q
        ? (c.display_name || '').toLowerCase().includes(q) ||
          (c.handle || '').toLowerCase().includes(q) ||
          (c.primary_specialization || '').toLowerCase().includes(q) ||
          (c.location || '').toLowerCase().includes(q)
        : true;

      const matchesTier = tierFilter ? c.verification_tier === tierFilter : true;
      const matchesAvailability = availabilityFilter
        ? c.availability_status === availabilityFilter
        : true;
      const matchesApproval = approvalFilter
        ? (c.approval_status || 'PENDING').toUpperCase() === approvalFilter.toUpperCase()
        : true;

      return matchesSearch && matchesTier && matchesAvailability && matchesApproval;
    });
  }, [creators, searchQuery, tierFilter, availabilityFilter, approvalFilter]);

  // Statistics by approval state & tiers
  const totalCount = creators ? creators.length : 0;
  const pendingCount = creators
    ? creators.filter((c) => (c.approval_status || 'PENDING') === 'PENDING').length
    : 0;
  const approvedCount = creators
    ? creators.filter((c) => c.approval_status === 'APPROVED').length
    : 0;
  const rejectedCount = creators
    ? creators.filter((c) => c.approval_status === 'REJECTED').length
    : 0;
  const legacyCount = creators
    ? creators.filter((c) => c.approval_status === 'LEGACY_ACTIVE').length
    : 0;

  const renderStat = (val, defaultColor = '#1E0B38') => {
    if (isLoading && creators === null) {
      return (
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#9CA3AF', marginTop: '4px' }}>
          ...
        </div>
      );
    }
    if (error && creators === null) {
      return (
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#9CA3AF', marginTop: '4px' }} title={error}>
          —
        </div>
      );
    }
    return (
      <div style={{ fontSize: '26px', fontWeight: '800', color: defaultColor, marginTop: '4px' }}>
        {val}
      </div>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Success Alert */}
      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: '13px',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span>
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            style={{ border: 'none', background: 'transparent', color: '#065F46', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Error Alert */}
      {actionErrorMsg && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: '13px',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{actionErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            style={{ border: 'none', background: 'transparent', color: '#991B1B', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP APPROVAL LIFECYCLE STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {/* Total Creators */}
        <div
          onClick={() => setApprovalFilter('')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: approvalFilter === '' ? '1.5px solid #7952EC' : '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Total Queue</div>
          {renderStat(totalCount, '#1E0B38')}
          <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '2px' }}>All creator records</div>
        </div>

        {/* Pending Approval (Urgent attention) */}
        <div
          onClick={() => setApprovalFilter(approvalFilter === 'PENDING' ? '' : 'PENDING')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: approvalFilter === 'PENDING' ? '2px solid #F59E0B' : '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400E' }}>Pending Review</span>
            <span style={{ fontSize: '12px' }}>⏳</span>
          </div>
          {renderStat(pendingCount, '#D97706')}
          <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '2px' }}>Awaiting admin decision</div>
        </div>

        {/* Approved Creators */}
        <div
          onClick={() => setApprovalFilter(approvalFilter === 'APPROVED' ? '' : 'APPROVED')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: approvalFilter === 'APPROVED' ? '2px solid #10B981' : '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#065F46' }}>Approved</span>
            <span style={{ fontSize: '12px' }}>✓</span>
          </div>
          {renderStat(approvedCount, '#059669')}
          <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>Active marketplace access</div>
        </div>

        {/* Rejected / Revisions Requested */}
        <div
          onClick={() => setApprovalFilter(approvalFilter === 'REJECTED' ? '' : 'REJECTED')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: approvalFilter === 'REJECTED' ? '2px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B' }}>Rejected</span>
            <span style={{ fontSize: '12px' }}>✕</span>
          </div>
          {renderStat(rejectedCount, '#DC2626')}
          <div style={{ fontSize: '11.5px', color: '#B91C1C', marginTop: '2px' }}>Feedback sent to creator</div>
        </div>

        {/* Legacy Active */}
        <div
          onClick={() => setApprovalFilter(approvalFilter === 'LEGACY_ACTIVE' ? '' : 'LEGACY_ACTIVE')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem',
            border: approvalFilter === 'LEGACY_ACTIVE' ? '2px solid #7952EC' : '1px solid rgba(121, 82, 236, 0.25)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#5B21B6' }}>Legacy Active</span>
            <span style={{ fontSize: '12px' }}>🏛️</span>
          </div>
          {renderStat(legacyCount, '#6D28D9')}
          <div style={{ fontSize: '11.5px', color: '#7C3AED', marginTop: '2px' }}>Grandfathered access</div>
        </div>
      </div>

      {/* 2. CONTROLS & DIRECTORY TABLE */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(121, 82, 236, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        {/* Header Controls */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
                Creator Approval Queue &amp; Directory
              </h2>
              <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                Showing {filteredCreators.length} of {totalCount} registered creators
              </div>
            </div>

            {/* Approval Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6B7280' }}>Status:</span>
              <button
                type="button"
                onClick={() => setApprovalFilter('')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: approvalFilter === '' ? '#1E0B38' : '#F3F4F6',
                  color: approvalFilter === '' ? '#FFFFFF' : '#4B5563',
                }}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setApprovalFilter('PENDING')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: approvalFilter === 'PENDING' ? '#F59E0B' : '#FEF3C7',
                  color: approvalFilter === 'PENDING' ? '#FFFFFF' : '#92400E',
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setApprovalFilter('APPROVED')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: approvalFilter === 'APPROVED' ? '#059669' : '#ECFDF5',
                  color: approvalFilter === 'APPROVED' ? '#FFFFFF' : '#065F46',
                }}
              >
                Approved ({approvedCount})
              </button>
              <button
                type="button"
                onClick={() => setApprovalFilter('REJECTED')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: approvalFilter === 'REJECTED' ? '#DC2626' : '#FEF2F2',
                  color: approvalFilter === 'REJECTED' ? '#FFFFFF' : '#991B1B',
                }}
              >
                Rejected ({rejectedCount})
              </button>
              <button
                type="button"
                onClick={() => setApprovalFilter('LEGACY_ACTIVE')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: approvalFilter === 'LEGACY_ACTIVE' ? '#7952EC' : '#EDE9FE',
                  color: approvalFilter === 'LEGACY_ACTIVE' ? '#FFFFFF' : '#5B21B6',
                }}
              >
                Legacy Active ({legacyCount})
              </button>
            </div>
          </div>

          {/* Search & Tier Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                color: '#374151',
              }}
            >
              <option value="">All Tiers</option>
              <option value="TOP_STUDIO">Top Studio</option>
              <option value="VERIFIED_PRO">Verified Pro</option>
              <option value="COMMUNITY">Community</option>
            </select>

            <input
              type="text"
              placeholder="Search creator, handle, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
                fontSize: '12px',
                outline: 'none',
                width: '240px',
              }}
            />

            <button
              type="button"
              onClick={fetchCreators}
              disabled={isLoading}
              style={{
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                color: '#374151',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              title="Refresh queue from backend"
            >
              {isLoading ? '...' : '↻'}
            </button>
          </div>
        </div>

        {/* Directory Table */}
        {error ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#DC2626' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
              Error Loading Creator Approval Queue
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', maxWidth: '560px', margin: '0 auto 1.25rem', lineHeight: '1.6' }}>
              {error}
            </div>
            <button
              type="button"
              onClick={fetchCreators}
              style={{
                backgroundColor: '#7952EC',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(121, 82, 236, 0.25)',
              }}
            >
              Retry Loading Queue
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Creator</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Specialization</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Approval State</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Verification Tier</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Portfolio &amp; Evidence</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Submitted / Joined</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Review Notes</th>
                  <th style={{ padding: '10px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (!creators || creators.length === 0) ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3.5rem', textAlign: 'center', color: '#9CA3AF' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Loading creator approval queue...</div>
                      <div style={{ fontSize: '12px' }}>Fetching records from backend administrative API</div>
                    </td>
                  </tr>
                ) : (!filteredCreators || filteredCreators.length === 0) ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3.5rem', textAlign: 'center', color: '#9CA3AF' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                        No creators found
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        No creator profiles match the current filter criteria ({approvalFilter || 'ALL'}).
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCreators.map((creator) => {
                    const avatarSrc = getCreatorAvatar(creator);
                    const statusVal = creator.approval_status || 'PENDING';

                    const statusBadgeStyle =
                      statusVal === 'APPROVED'
                        ? { bg: '#DCFCE7', text: '#166534', label: 'APPROVED' }
                        : statusVal === 'REJECTED'
                        ? { bg: '#FEE2E2', text: '#991B1B', label: 'REJECTED' }
                        : statusVal === 'LEGACY_ACTIVE'
                        ? { bg: '#EDE9FE', text: '#5B21B6', label: 'LEGACY_ACTIVE' }
                        : { bg: '#FEF3C7', text: '#92400E', label: 'PENDING' };

                    const tierColor =
                      creator.verification_tier === 'TOP_STUDIO'
                        ? { bg: '#EDE9FE', text: '#6D28D9', label: 'Top Studio' }
                        : creator.verification_tier === 'VERIFIED_PRO'
                        ? { bg: '#D1FAE5', text: '#065F46', label: 'Verified Pro' }
                        : { bg: '#FEF3C7', text: '#92400E', label: 'Community' };

                    return (
                      <tr
                        key={creator.id || creator.creator_id}
                        style={{
                          borderBottom: '1px solid #F3F4F6',
                          transition: 'background-color 0.15s ease',
                          backgroundColor: statusVal === 'PENDING' ? '#FFFDF8' : 'transparent',
                        }}
                      >
                        {/* Creator Avatar & Handle */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={avatarSrc}
                              alt={creator.display_name}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid #E5E7EB',
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/portfolio/sophia_cellular_dew_thumb.jpg';
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: '700', color: '#1E0B38' }}>
                                {creator.display_name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                @{creator.handle} • {creator.location || 'Remote'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Specialization */}
                        <td style={{ padding: '12px 16px', color: '#374151' }}>
                          <span
                            style={{
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}
                          >
                            {creator.primary_specialization || 'Generative Artist'}
                          </span>
                        </td>

                        {/* Approval State Badge */}
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: statusBadgeStyle.bg,
                              color: statusBadgeStyle.text,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            ● {statusBadgeStyle.label}
                          </span>
                        </td>

                        {/* Verification Tier */}
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: tierColor.bg,
                              color: tierColor.text,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🛡️</span>
                            <span>{tierColor.label}</span>
                          </span>
                        </td>

                        {/* Portfolio & Evidence Counts */}
                        <td style={{ padding: '12px 16px', color: '#4B5563' }}>
                          <div style={{ fontWeight: '600', fontSize: '11.5px' }}>
                            {creator.portfolio_count || 0} project{creator.portfolio_count === 1 ? '' : 's'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {creator.evidence_count || 0} evidence record{creator.evidence_count === 1 ? '' : 's'}
                          </div>
                        </td>

                        {/* Submission / Created Timestamp */}
                        <td style={{ padding: '12px 16px', color: '#4B5563', fontSize: '11.5px' }}>
                          {formatDate(creator.submitted_at || creator.created_at)}
                        </td>

                        {/* Review Notes Preview */}
                        <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                          {creator.reviewer_notes ? (
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: statusVal === 'REJECTED' ? '#B91C1C' : '#4B5563',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={creator.reviewer_notes}
                            >
                              💬 {creator.reviewer_notes}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>—</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setReviewingCreator(creator)}
                              style={{
                                backgroundColor: statusVal === 'PENDING' ? '#F59E0B' : '#7952EC',
                                border: 'none',
                                color: '#FFFFFF',
                                padding: '5px 12px',
                                borderRadius: '7px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(121, 82, 236, 0.25)',
                              }}
                              title="Review creator profile, portfolio & submit approval/rejection decision"
                            >
                              {statusVal === 'PENDING' ? 'Review ⚡' : 'Inspect / Edit'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedCreatorModal(creator)}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                color: '#374151',
                                padding: '5px 8px',
                                borderRadius: '7px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                              title="Quick bio overview"
                            >
                              Bio
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onInspectCreatorVerifications) {
                                  onInspectCreatorVerifications(creator.handle || creator.display_name);
                                }
                              }}
                              style={{
                                backgroundColor: '#EDE9FE',
                                border: 'none',
                                color: '#6D28D9',
                                padding: '5px 8px',
                                borderRadius: '7px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                              title="Filter verification requests for this creator"
                            >
                              Verifications ›
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creator Detail Inspect Modal */}
      {selectedCreatorModal && (
        <div
          onClick={() => setSelectedCreatorModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={getCreatorAvatar(selectedCreatorModal)}
                  alt={selectedCreatorModal.display_name}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E0B38' }}>
                    {selectedCreatorModal.display_name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                    @{selectedCreatorModal.handle} • {selectedCreatorModal.location || 'Remote'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCreatorModal(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: '#6B7280' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.6, marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#1E0B38' }}>Biography</p>
              <p style={{ margin: 0 }}>{selectedCreatorModal.bio || 'No biography provided.'}</p>
            </div>

            <div style={{ backgroundColor: '#F9FAFB', padding: '10px 12px', borderRadius: '10px', fontSize: '11.5px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Approval Status:</strong> {selectedCreatorModal.approval_status || 'PENDING'}</div>
              <div><strong>Primary Specialization:</strong> {selectedCreatorModal.primary_specialization || 'Generative Artist'}</div>
              <div><strong>Experience:</strong> {selectedCreatorModal.years_experience || 1} year(s)</div>
              <div><strong>Verification Tier:</strong> {selectedCreatorModal.verification_tier}</div>
              <div><strong>Portfolio Projects:</strong> {selectedCreatorModal.portfolio_count || 0}</div>
              <div><strong>Evidence Records:</strong> {selectedCreatorModal.evidence_count || 0}</div>
              {selectedCreatorModal.reviewer_notes && (
                <div><strong>Previous Reviewer Note:</strong> {selectedCreatorModal.reviewer_notes}</div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedCreatorModal(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedCreatorModal.handle || selectedCreatorModal.display_name;
                  setSelectedCreatorModal(null);
                  if (onInspectCreatorVerifications) {
                    onInspectCreatorVerifications(target);
                  }
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Filter Verification Requests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator Review & Approval Modal */}
      {reviewingCreator && (
        <CreatorReviewModal
          creator={reviewingCreator}
          isOpen={Boolean(reviewingCreator)}
          onClose={() => setReviewingCreator(null)}
          onApprovalUpdated={handleApprovalUpdated}
        />
      )}
    </div>
  );
}
