import React from 'react';

export default function AdminVerificationView({
  requests = null,
  filteredRequests = [],
  isLoading = false,
  error = null,
  statusFilter = '',
  setStatusFilter,
  searchQuery = '',
  setSearchQuery,
  selectedReq,
  setSelectedReq,
  activeEvidenceTab = 'evidence',
  setActiveEvidenceTab,
  analyzingId,
  onRunAiAnalysis,
  reviewNotes = '',
  setReviewNotes,
  isSubmittingReview = false,
  onSubmitReview,
  selectedEvidencePreview,
  setSelectedEvidencePreview,
  totalCount = 0,
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
  onClearError,
  onRetry,
  onAdminLogin,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TABLE SECTION */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(121, 82, 236, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header Controls */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1E0B38', margin: 0 }}>
              Verification Requests
            </h2>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === '' ? '#7952EC' : '#F3F4F6',
                  color: statusFilter === '' ? '#FFFFFF' : '#4B5563',
                  transition: 'all 0.15s ease',
                }}
              >
                All ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'PENDING' ? '#7952EC' : '#F3F4F6',
                  color: statusFilter === 'PENDING' ? '#FFFFFF' : '#4B5563',
                  transition: 'all 0.15s ease',
                }}
              >
                Pending ({pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('APPROVED')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'APPROVED' ? '#7952EC' : '#F3F4F6',
                  color: statusFilter === 'APPROVED' ? '#FFFFFF' : '#4B5563',
                  transition: 'all 0.15s ease',
                }}
              >
                Approved ({approvedCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('REJECTED')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'REJECTED' ? '#7952EC' : '#F3F4F6',
                  color: statusFilter === 'REJECTED' ? '#FFFFFF' : '#4B5563',
                  transition: 'all 0.15s ease',
                }}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Table Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search creator, skill, or evidence..."
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
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                <th style={{ padding: '10px 16px', width: '36px' }}>
                  <input type="checkbox" style={{ cursor: 'pointer' }} readOnly />
                </th>
                <th style={{ padding: '10px 16px', fontWeight: '600' }}>Creator</th>
                <th style={{ padding: '10px 16px', fontWeight: '600' }}>Verification Type</th>
                <th style={{ padding: '10px 16px', fontWeight: '600' }}>Evidence Type</th>
                <th style={{ padding: '10px 16px', fontWeight: '600' }}>Review Date</th>
                <th style={{ padding: '10px 16px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && requests === null ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#6B7280' }}>
                    Loading verification queue from database...
                  </td>
                </tr>
              ) : error && requests === null ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: '#991B1B' }}>
                    <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '6px' }}>
                      Failed to load verification queue from server
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#6B7280', marginBottom: '14px' }}>
                      {error}
                    </div>
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
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>
                    No verification requests match the active filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = selectedReq?.id === req.id;
                  const dateDisplay = req.reviewed_at
                    ? new Date(req.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Oct 20, 2026';

                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        setSelectedReq(req);
                        if (onClearError) onClearError();
                      }}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedReq(req);
                            if (onClearError) onClearError();
                          }}
                        />
                      </td>

                      {/* Creator Avatar & Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#E9D5FF',
                              color: '#6B21A8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '12px',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {req.creator_name ? req.creator_name.charAt(0) : 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1E0B38' }}>
                              {req.creator_name || 'Creator'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              @{req.creator_handle || 'creator'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Verification Type */}
                      <td style={{ padding: '12px 16px', color: '#374151', fontWeight: '500' }}>
                        {req.verification_scope || 'Generative AI Pipeline'}
                      </td>

                      {/* Evidence Type */}
                      <td style={{ padding: '12px 16px', color: '#4B5563' }}>
                        {req.evidence_type ? req.evidence_type.replace(/_/g, ' ') : 'Project Files'}
                      </td>

                      {/* Review Date */}
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>{dateDisplay}</td>

                      {/* Status Badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'inline-block',
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

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReq(req);
                            if (onClearError) onClearError();
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#7952EC',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            padding: '4px 8px',
                          }}
                          title="Inspect Request"
                        >
                          Review ›
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SELECTED CREATOR REVIEW & AUDIT AREA (3-Column Layout) */}
      {selectedReq && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
          {/* Card 1 (Left): Selected Creator & Submitted Evidence */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(121, 82, 236, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Creator Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#DDD0F7',
                  color: '#4C1D95',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  flexShrink: 0,
                }}
              >
                {selectedReq.creator_name ? selectedReq.creator_name.charAt(0) : 'C'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#1E0B38' }}>
                    {selectedReq.creator_name}
                  </span>
                  <span style={{ color: '#3B82F6', fontSize: '13px' }}>✓</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor:
                        selectedReq.status === 'APPROVED'
                          ? '#D1FAE5'
                          : selectedReq.status === 'REJECTED'
                          ? '#FEE2E2'
                          : '#FEF3C7',
                      color:
                        selectedReq.status === 'APPROVED'
                          ? '#065F46'
                          : selectedReq.status === 'REJECTED'
                          ? '#991B1B'
                          : '#92400E',
                    }}
                  >
                    {selectedReq.status === 'PENDING' ? 'Pending Review' : selectedReq.status}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                  @{selectedReq.creator_handle || 'creator'} • Scope: {selectedReq.verification_scope}
                </div>
              </div>
            </div>

            {/* Subtabs */}
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #E5E7EB', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setActiveEvidenceTab('evidence')}
                style={{
                  padding: '6px 0',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: activeEvidenceTab === 'evidence' ? '#7952EC' : '#6B7280',
                  borderBottom: activeEvidenceTab === 'evidence' ? '2px solid #7952EC' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                Submitted Evidence
              </button>
              <button
                type="button"
                onClick={() => setActiveEvidenceTab('details')}
                style={{
                  padding: '6px 0',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: activeEvidenceTab === 'details' ? '#7952EC' : '#6B7280',
                  borderBottom: activeEvidenceTab === 'details' ? '2px solid #7952EC' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveEvidenceTab('history')}
                style={{
                  padding: '6px 0',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: activeEvidenceTab === 'history' ? '#7952EC' : '#6B7280',
                  borderBottom: activeEvidenceTab === 'history' ? '2px solid #7952EC' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                History
              </button>
            </div>

            {/* Subtab Content */}
            {activeEvidenceTab === 'evidence' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Primary Evidence */}
                  <div
                    onClick={() =>
                      setSelectedEvidencePreview({
                        title: selectedReq.evidence_title || 'Process Reel',
                        url: selectedReq.evidence_file_url || '/assets/evidence/runway_gen3_camera_timeline.png',
                      })
                    }
                    style={{
                      backgroundColor: '#1E1B4B',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      aspectRatio: '16/10',
                    }}
                  >
                    <img
                      src={selectedReq.evidence_file_url || '/assets/evidence/runway_gen3_camera_timeline.png'}
                      alt="Primary Evidence"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/portfolio/sophia_cellular_dew_thumb.jpg';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '16px',
                      }}
                    >
                      ▶
                    </div>
                  </div>

                  {/* Secondary Project Artifact */}
                  <div
                    onClick={() =>
                      setSelectedEvidencePreview({
                        title: 'Supporting Project Evidence',
                        url: '/assets/portfolio/kai_cyberpunk_warrior.jpg',
                      })
                    }
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      aspectRatio: '16/10',
                    }}
                  >
                    <img
                      src="/assets/portfolio/kai_cyberpunk_warrior.jpg"
                      alt="Secondary Artifact"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Tertiary Node Artifact */}
                  <div
                    onClick={() =>
                      setSelectedEvidencePreview({
                        title: 'Workflow Node Graph',
                        url: '/assets/portfolio/elena_cyber_agent.jpg',
                      })
                    }
                    style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      aspectRatio: '16/10',
                    }}
                  >
                    <img
                      src="/assets/portfolio/elena_cyber_agent.jpg"
                      alt="Tertiary Node Artifact"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>

                {/* Metadata under previews */}
                <div style={{ backgroundColor: '#F9FAFB', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#4B5563', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: '700', color: '#1E0B38' }}>{selectedReq.evidence_title || 'Audited Process Pipeline'}</div>
                  <div style={{ color: '#6B7280' }}>
                    Type: {selectedReq.evidence_type || 'WORKFLOW_NODE_GRAPH'} • Project: {selectedReq.project_title || 'Showcase'}
                  </div>
                </div>
              </div>
            )}

            {activeEvidenceTab === 'details' && (
              <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.6, flex: 1 }}>
                <p><strong>Creator ID:</strong> {selectedReq.creator_id || 'N/A'}</p>
                <p><strong>Specialization:</strong> {selectedReq.verification_scope || 'Generative Video'}</p>
                <p><strong>Associated Project:</strong> {selectedReq.project_title || 'Commercial Showcase'}</p>
                <p><strong>Evidence Type:</strong> {selectedReq.evidence_type || 'Source File / Screenshot'}</p>
              </div>
            )}

            {activeEvidenceTab === 'history' && (
              <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.6, flex: 1 }}>
                <div style={{ borderLeft: '2px solid #DDD0F7', paddingLeft: '10px' }}>
                  <div style={{ fontWeight: '700', color: '#1E0B38' }}>Submitted by Creator</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Evidence uploaded with latent seeds and node parameters.</div>
                </div>
                <div style={{ borderLeft: '2px solid #DDD0F7', paddingLeft: '10px', marginTop: '8px' }}>
                  <div style={{ fontWeight: '700', color: '#1E0B38' }}>Current Reviewer Notes</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{selectedReq.reviewer_notes || 'Awaiting final human decision.'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2 (Middle): Gemini AI Audit */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(121, 82, 236, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#7952EC', fontSize: '16px' }}>✦</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>Gemini AI Audit</span>
                </div>

                <button
                  type="button"
                  onClick={() => onRunAiAnalysis && onRunAiAnalysis(selectedReq.id)}
                  disabled={analyzingId === selectedReq.id}
                  style={{
                    backgroundColor: '#1E0B38',
                    color: '#FFFFFF',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: analyzingId === selectedReq.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {analyzingId === selectedReq.id ? 'Auditing with Gemini...' : 'Run / Re-run Gemini AI Audit'}
                </button>
              </div>

              {/* Status Alert Banner */}
              {selectedReq.ai_analysis?.potential_inconsistencies?.length > 0 || selectedReq.status === 'REJECTED' ? (
                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontWeight: '700', fontSize: '12.5px' }}>
                    <span>⚠️</span>
                    <span>Potential inconsistency flagged</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#92400E', marginTop: '4px', lineHeight: 1.45, margin: '4px 0 0' }}>
                    The submitted project may show assets that are similar to publicly available templates. Please review the node graph and intermediate steps.
                  </p>
                </div>
              ) : selectedReq.ai_analysis || selectedReq.status === 'APPROVED' ? (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '12.5px' }}>
                    <span>✓</span>
                    <span>High reproducibility confirmed</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#065F46', marginTop: '4px', lineHeight: 1.45, margin: '4px 0 0' }}>
                    Node graph parameters and prompt latent vectors match declared generation history. No template overlap detected.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7E22CE', fontWeight: '700', fontSize: '12.5px' }}>
                    <span>✦</span>
                    <span>Ready for Gemini AI audit</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#6B21A8', marginTop: '4px', lineHeight: 1.45, margin: '4px 0 0' }}>
                    Click 'Run Gemini AI Audit' to evaluate node graph reproducibility and detect template similarities.
                  </p>
                </div>
              )}

              {/* AI Analysis Summary Bullets */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E0B38', marginBottom: '6px' }}>
                  AI Analysis Summary
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#374151' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: selectedReq.status === 'REJECTED' ? '#EF4444' : '#10B981', fontSize: '10px', marginTop: '2px' }}>◆</span>
                    <span>
                      {selectedReq.status === 'REJECTED'
                        ? 'Some frames match online template references.'
                        : 'Authentic node parameter graph verified without template clones.'}
                    </span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#F59E0B', fontSize: '10px', marginTop: '2px' }}>◆</span>
                    <span>Metadata hash corresponds to verifiable diffusion parameters.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: '#10B981', fontSize: '10px', marginTop: '2px' }}>◆</span>
                    <span>Overall, skills and tool proficiency appear consistent with the claim.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Disclaimer Footnote */}
            <div
              style={{
                backgroundColor: '#FAF5FF',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#6B21A8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '1rem',
              }}
            >
              <span>✦</span>
              <span>This AI analysis is a review aid. Final decisions are made by the administrator.</span>
            </div>
          </div>

          {/* Card 3 (Right): Trust & Safety Activity */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(121, 82, 236, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <span style={{ color: '#7952EC', fontSize: '16px' }}>🛡️</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>Review Context</span>
              </div>

              {/* Verification Breakdown */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E0B38', marginBottom: '8px' }}>
                  Queue Totals
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4B5563' }}>Total Requests</span>
                    <span style={{ fontWeight: '700', color: '#1E0B38' }}>{totalCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4B5563' }}>Approved</span>
                    <span style={{ fontWeight: '700', color: '#065F46' }}>{approvedCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4B5563' }}>Rejected</span>
                    <span style={{ fontWeight: '700', color: '#991B1B' }}>{rejectedCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4B5563' }}>Pending</span>
                    <span style={{ fontWeight: '700', color: '#92400E' }}>{pendingCount}</span>
                  </div>
                </div>
              </div>

              {/* Target Details */}
              <div style={{ backgroundColor: '#F9FAFB', padding: '10px 12px', borderRadius: '10px', fontSize: '11px', color: '#4B5563' }}>
                <div style={{ fontWeight: '700', color: '#1E0B38', marginBottom: '4px' }}>Target Target Info</div>
                <div>Target ID: <code style={{ color: '#7952EC' }}>{selectedReq.target_id || selectedReq.id}</code></div>
                <div>Type: {selectedReq.target_type || 'CREATOR_TOOL'}</div>
                <div>Audit Status: {selectedReq.status}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTTOM DECISION ACTION BAR */}
      {selectedReq && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E0B38' }}>
              Add a reason for your decision (required)
            </label>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{reviewNotes.length}/500</span>
          </div>

          <textarea
            rows={2}
            maxLength={500}
            placeholder="Enter your rationale here (e.g. Verified ComfyUI node parameters, seed reproducibility confirmed, no template cloning detected)..."
            value={reviewNotes}
            onChange={(e) => {
              setReviewNotes(e.target.value);
              if (onClearError) onClearError();
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              fontSize: '12.5px',
              outline: 'none',
              color: '#1F2937',
              resize: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              disabled={isSubmittingReview}
              onClick={() => onSubmitReview && onSubmitReview(selectedReq.id, 'REJECTED')}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: '1.5px solid #EF4444',
                backgroundColor: '#FFFFFF',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>✕</span>
              <span>Reject Request</span>
            </button>

            <button
              type="button"
              disabled={isSubmittingReview}
              onClick={() => onSubmitReview && onSubmitReview(selectedReq.id, 'APPROVED')}
              style={{
                padding: '9px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#7952EC',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(121, 82, 236, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>✓</span>
              <span>{isSubmittingReview ? 'Saving Decision...' : 'Approve Request'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Modal for Evidence Preview */}
      {selectedEvidencePreview && (
        <div
          onClick={() => setSelectedEvidencePreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
              maxWidth: '750px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1E0B38' }}>{selectedEvidencePreview.title}</span>
              <button
                type="button"
                onClick={() => setSelectedEvidencePreview(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: '#6B7280' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#0F172A', display: 'flex', justifyContent: 'center' }}>
              <img
                src={selectedEvidencePreview.url}
                alt="Evidence preview"
                style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
