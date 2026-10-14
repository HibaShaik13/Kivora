import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getCreatorAvatar } from '../utils/visualAssetHelpers';
import BrandLogo from './BrandLogo';
// Lightweight inline SVG icons
const X = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const CheckCircle = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const Clock = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const AlertCircle = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);
const Upload = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);
const Eye = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const FileText = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const Sparkles = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
);
const MessageSquare = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const Star = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
const ArrowRight = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);
const ShieldCheck = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
);
const Download = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const Layers = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
);
const RefreshCw = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const ChevronRight = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);
const Plus = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default function CollaborationWorkspaceModal({
  isOpen,
  onClose,
  engagementId,
  user,
  onOpenMessages,
  onUpdated,
}) {
  const [workspace, setWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'milestones' | 'compare' | 'ai-review' | 'timeline' | 'reviews'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deliverable Submission Form
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitAssetUrl, setSubmitAssetUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Revision Form
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Milestone Creation Form
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneParty, setNewMilestoneParty] = useState('CREATOR');

  // Version Comparison
  const [versionA, setVersionA] = useState(1);
  const [versionB, setVersionB] = useState(2);
  const [compareData, setCompareData] = useState(null);
  const [comparing, setComparing] = useState(false);

  // AI Review
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5.0);
  const [reviewText, setReviewText] = useState('');
  const [reviewCommRating, setReviewCommRating] = useState(5.0);
  const [reviewQualityRating, setReviewQualityRating] = useState(5.0);
  const [reviewTimeRating, setReviewTimeRating] = useState(5.0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWorkspace(engagementId);
      setWorkspace(data);

      const delivs = data.deliverables || [];
      if (delivs.length >= 2) {
        setVersionA(delivs[delivs.length - 2].version);
        setVersionB(delivs[delivs.length - 1].version);
      } else if (delivs.length === 1) {
        setVersionA(delivs[0].version);
        setVersionB(delivs[0].version);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && engagementId) {
      loadWorkspace();
    }
  }, [isOpen, engagementId]);

  if (!isOpen) return null;

  const eng = workspace?.engagement;
  const isBrand = workspace?.user_role === 'BRAND';
  const isCreator = workspace?.user_role === 'CREATOR';
  const deliverables = workspace?.deliverables || [];
  const milestones = workspace?.milestones || [];
  const events = workspace?.events || [];
  const latestDeliverable = deliverables.length ? deliverables[deliverables.length - 1] : null;

  // Handlers
  const handleDeliverableSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (submitTitle) formData.append('title', submitTitle);
        if (submitNotes) formData.append('notes', submitNotes);
        await api.uploadDeliverableFile(engagementId, formData);
      } else {
        await api.submitDeliverableVersion(engagementId, {
          title: submitTitle || `Deliverable Draft`,
          notes: submitNotes || 'Uploaded asset package.',
          asset_url: submitAssetUrl || 'https://assets.kivora.internal/deliverables/sample.mp4',
        });
      }
      setShowSubmitModal(false);
      setSubmitTitle('');
      setSubmitNotes('');
      setSubmitAssetUrl('');
      setSelectedFile(null);
      await loadWorkspace();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) return;
    try {
      setSubmittingRevision(true);
      await api.requestDeliverableRevision(engagementId, { feedback: revisionFeedback });
      setShowRevisionModal(false);
      setRevisionFeedback('');
      await loadWorkspace();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || 'Revision request failed.');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this master deliverable version? This releases milestone approval to the creator.')) return;
    try {
      await api.approveDeliverableVersion(engagementId);
      await loadWorkspace();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || 'Approval failed.');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Finalize and complete this collaboration? This concludes production and opens the performance review.')) return;
    try {
      await api.completeWorkspaceEngagement(engagementId);
      await loadWorkspace();
      setActiveTab('reviews');
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || 'Completion failed.');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    try {
      await api.createWorkspaceMilestone(engagementId, {
        title: newMilestoneTitle,
        description: newMilestoneDesc,
        responsible_party: newMilestoneParty,
        sequence_order: milestones.length + 1,
      });
      setShowAddMilestone(false);
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
      await loadWorkspace();
    } catch (err) {
      alert(err.message || 'Failed to create milestone.');
    }
  };

  const handleToggleMilestone = async (m) => {
    const nextStatus = m.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.updateWorkspaceMilestone(engagementId, m.id, { status: nextStatus });
      await loadWorkspace();
    } catch (err) {
      alert(err.message || 'Failed to update milestone.');
    }
  };

  const handleCompare = async () => {
    try {
      setComparing(true);
      const res = await api.compareDeliverableVersions(engagementId, versionA, versionB);
      setCompareData(res);
    } catch (err) {
      alert(err.message || 'Comparison failed.');
    } finally {
      setComparing(false);
    }
  };

  const handleRunAiReview = async (delivId) => {
    try {
      setAiLoading(true);
      const targetId = delivId || (latestDeliverable?.id);
      if (!targetId) return;
      const res = await api.requestAiReview(engagementId, targetId);
      setAiReport(res);
      setActiveTab('ai-review');
    } catch (err) {
      alert(err.message || 'AI review failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      await api.submitCollaborationReview(engagementId, {
        rating: reviewRating,
        review_text: reviewText,
        communication_rating: reviewCommRating,
        quality_rating: reviewQualityRating,
        timeliness_rating: reviewTimeRating,
      });
      alert('Review successfully submitted!');
      await loadWorkspace();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || 'Review submission failed.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-container glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1040px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px',
        }}
      >
        {/* TOP BAR */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ECEAE4', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge-editorial" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                <span className="badge-dot" /> COLLABORATION WORKSPACE
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#F4F2EC', color: '#555' }}>
                {eng?.status || 'ACTIVE'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1A1A1A' }}>
              {workspace?.brief?.title || 'Creative Campaign Workspace'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {workspace?.conversation_id && onOpenMessages && (
              <button
                className="btn-outline"
                style={{ fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  onClose();
                  onOpenMessages(workspace.conversation_id);
                }}
              >
                <MessageSquare size={14} /> Open Discussion
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOADING / ERROR */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
            <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px auto' }} />
            <p>Loading collaboration context...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px auto' }} />
            <p>{error}</p>
            <button className="btn-secondary" onClick={loadWorkspace} style={{ marginTop: '12px' }}>Retry</button>
          </div>
        ) : (
          <>
            {/* WORKSPACE PROGRESS & NEXT ACTION HERO BANNER */}
            <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F1E8 100%)', borderBottom: '1px solid #ECEAE4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#7952EC' }}>
                    {workspace.current_milestone_title}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                    Next Action: {workspace.next_required_action?.action_label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {workspace.next_required_action?.action_description}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>
                    {workspace.progress_percentage}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Progress Complete
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: '#E5E0D8', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${workspace.progress_percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #7952EC 0%, #9B77FF 100%)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ECEAE4', background: '#FFFFFF', padding: '0 24px' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'milestones', label: `Milestones (${milestones.length}) & Deliverables (${deliverables.length})` },
                { id: 'compare', label: 'Version Compare' },
                { id: 'ai-review', label: 'AI Review ✨' },
                { id: 'timeline', label: `Timeline (${events.length})` },
                { id: 'reviews', label: 'Reviews & Sign-off' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: activeTab === t.id ? '#7952EC' : '#6B7280',
                    borderBottom: activeTab === t.id ? '2px solid #7952EC' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* BODY CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#FBFBFA' }}>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                  <div>
                    <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #EAE6DF', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Campaign Objectives</h3>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4B5563', margin: 0 }}>
                        {workspace.brief?.campaign_objective || 'No objective provided.'}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', color: '#6B7280' }}>
                        <span>Format: <strong>{workspace.brief?.content_type}</strong></span>
                        <span>Ratio: <strong>{workspace.brief?.aspect_ratio}</strong></span>
                        <span>Target: <strong>{workspace.brief?.resolution_min}</strong></span>
                        <span>Agreed: <strong>${eng?.agreed_amount?.toLocaleString()}</strong></span>
                      </div>
                    </div>

                    {/* Quick Deliverable Card */}
                    <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Latest Deliverable</h3>
                        {latestDeliverable && (
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: latestDeliverable.status === 'APPROVED' ? '#DCFCE7' : '#FEF3C7', color: latestDeliverable.status === 'APPROVED' ? '#166534' : '#92400E' }}>
                            {latestDeliverable.status}
                          </span>
                        )}
                      </div>

                      {latestDeliverable ? (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            {latestDeliverable.title} (v{latestDeliverable.version})
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 12px 0' }}>
                            Submitted: {new Date(latestDeliverable.submitted_at).toLocaleString()}
                          </div>
                          {latestDeliverable.notes && (
                            <p style={{ fontSize: '13px', background: '#F9FAFB', padding: '10px 12px', borderRadius: '6px', color: '#4B5563', margin: '0 0 12px 0' }}>
                              "{latestDeliverable.notes}"
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <a
                              href={latestDeliverable.asset_url || `/api/workspaces/${engagementId}/deliverables/${latestDeliverable.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-outline"
                              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Download size={14} /> Download Asset
                            </a>
                            {isBrand && latestDeliverable.status !== 'APPROVED' && (
                              <>
                                <button
                                  className="btn-outline"
                                  style={{ fontSize: '12px', padding: '6px 12px' }}
                                  onClick={() => setShowRevisionModal(true)}
                                >
                                  Request Revisions
                                </button>
                                <button
                                  className="btn-primary"
                                  style={{ fontSize: '12px', padding: '6px 12px' }}
                                  onClick={handleApprove}
                                >
                                  Approve v{latestDeliverable.version}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
                          <FileText size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                          <p style={{ fontSize: '13px', margin: 0 }}>No deliverables submitted yet.</p>
                          {isCreator && (
                            <button
                              className="btn-primary"
                              style={{ marginTop: '12px', fontSize: '12px', padding: '6px 12px' }}
                              onClick={() => setShowSubmitModal(true)}
                            >
                              Submit Initial Draft
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Participants Card */}
                  <div>
                    <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #EAE6DF', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 12px 0' }}>Participants</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <BrandLogo
                          brand={workspace.brand}
                          brandName={workspace.brand?.company_name}
                          size={40}
                          shape="rounded"
                          padding="2px"
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{workspace.brand?.company_name}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>Campaign Owner</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={getCreatorAvatar(workspace.creator)}
                          alt={workspace.creator?.display_name || 'Creator'}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/creator-portraits/devon.jpg';
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{workspace.creator?.display_name}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>@{workspace.creator?.handle}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
                      <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#6B7280', margin: '0 0 12px 0' }}>Quick Actions</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {isCreator && (
                          <button
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '13px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                            onClick={() => setShowSubmitModal(true)}
                          >
                            <Upload size={14} /> Submit New Deliverable Version
                          </button>
                        )}
                        {isBrand && eng?.status === 'FINAL_APPROVED' && (
                          <button
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '13px', padding: '8px', background: '#166534' }}
                            onClick={handleComplete}
                          >
                            <CheckCircle size={14} /> Complete Collaboration
                          </button>
                        )}
                        {deliverables.length > 0 && (
                          <button
                            className="btn-outline"
                            style={{ width: '100%', fontSize: '13px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleRunAiReview()}
                          >
                            <Sparkles size={14} /> AI Review Latest Version
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MILESTONES & DELIVERABLES */}
              {activeTab === 'milestones' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Milestone Progression</h3>
                    <button
                      className="btn-outline"
                      style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setShowAddMilestone(!showAddMilestone)}
                    >
                      <Plus size={14} /> Add Milestone
                    </button>
                  </div>

                  {showAddMilestone && (
                    <form onSubmit={handleAddMilestone} style={{ background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid #DDD', marginBottom: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Milestone title (e.g., Rough Cut Video)"
                          className="input-field"
                          value={newMilestoneTitle}
                          onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          required
                        />
                        <select
                          className="input-field"
                          value={newMilestoneParty}
                          onChange={(e) => setNewMilestoneParty(e.target.value)}
                        >
                          <option value="CREATOR">Assigned to Creator</option>
                          <option value="BRAND">Assigned to Brand</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        className="input-field"
                        style={{ marginBottom: '10px' }}
                        value={newMilestoneDesc}
                        onChange={(e) => setNewMilestoneDesc(e.target.value)}
                      />
                      <button type="submit" className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>Save Milestone</button>
                    </form>
                  )}

                  {milestones.length === 0 ? (
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '8px', textAlign: 'center', color: '#888', marginBottom: '24px' }}>
                      No custom milestones added yet. Standard project phases apply.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      {milestones.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            background: '#FFF',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #EAE6DF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={() => handleToggleMilestone(m)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.status === 'COMPLETED' ? '#166534' : '#D1D5DB' }}
                            >
                              <CheckCircle size={20} />
                            </button>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: m.status === 'COMPLETED' ? '#6B7280' : '#111827', textDecoration: m.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                                #{m.sequence_order}: {m.title}
                              </div>
                              {m.description && <div style={{ fontSize: '12px', color: '#6B7280' }}>{m.description}</div>}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: m.status === 'COMPLETED' ? '#DCFCE7' : '#F3F4F6', color: m.status === 'COMPLETED' ? '#166534' : '#4B5563' }}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ALL DELIVERABLE VERSIONS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Deliverable Submissions ({deliverables.length})</h3>
                    {isCreator && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => setShowSubmitModal(true)}
                      >
                        <Upload size={14} style={{ marginRight: '4px' }} /> Upload New Version
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {deliverables.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          background: '#FFF',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #EAE6DF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px' }}>v{d.version}</span>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{d.title}</span>
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: d.status === 'APPROVED' ? '#DCFCE7' : d.status === 'REVISION_REQUESTED' ? '#FEE2E2' : '#FEF3C7', color: d.status === 'APPROVED' ? '#166534' : d.status === 'REVISION_REQUESTED' ? '#991B1B' : '#92400E' }}>
                              {d.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0' }}>
                            Submitted: {new Date(d.submitted_at).toLocaleString()} {d.sha256_checksum && `• SHA-256: ${d.sha256_checksum.slice(0, 10)}...`}
                          </div>
                          {d.notes && <div style={{ fontSize: '13px', color: '#4B5563', fontStyle: 'italic' }}>Notes: {d.notes}</div>}
                          {d.feedback && (
                            <div style={{ fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '6px 10px', borderRadius: '4px', marginTop: '6px' }}>
                              Feedback: {d.feedback}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={d.asset_url || `/api/workspaces/${engagementId}/deliverables/${d.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-outline"
                            style={{ fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Download size={14} /> Download
                          </a>
                          <button
                            className="btn-outline"
                            style={{ fontSize: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleRunAiReview(d.id)}
                          >
                            <Sparkles size={14} /> AI Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: VERSION COMPARE */}
              {activeTab === 'compare' && (
                <div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid #DDD' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Version A</label>
                      <select className="input-field" value={versionA} onChange={(e) => setVersionA(parseInt(e.target.value))}>
                        {deliverables.map((d) => (
                          <option key={d.id} value={d.version}>v{d.version} ({d.title})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Version B</label>
                      <select className="input-field" value={versionB} onChange={(e) => setVersionB(parseInt(e.target.value))}>
                        {deliverables.map((d) => (
                          <option key={d.id} value={d.version}>v{d.version} ({d.title})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ alignSelf: 'flex-end' }}>
                      <button className="btn-primary" onClick={handleCompare} disabled={comparing}>
                        {comparing ? 'Comparing...' : 'Run Side-by-Side Comparison'}
                      </button>
                    </div>
                  </div>

                  {compareData && (
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>{compareData.summary}</h4>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                        Comparison Type: <span style={{ fontWeight: 600 }}>{compareData.comparison_type}</span>
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Older */}
                        <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                          <span style={{ fontSize: '11px', background: '#E5E7EB', padding: '2px 6px', borderRadius: '4px' }}>OLDER</span>
                          <h4 style={{ margin: '8px 0 4px 0' }}>v{compareData.older_version?.version}</h4>
                          <div style={{ fontSize: '12px', color: '#666' }}>Submitted: {new Date(compareData.older_version?.submitted_at).toLocaleString()}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Status: {compareData.older_version?.status}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Checksum: {compareData.older_version?.sha256_checksum?.slice(0, 16) || 'N/A'}</div>
                          {compareData.older_version?.notes && (
                            <div style={{ marginTop: '10px', fontSize: '13px', background: '#F9FAFB', padding: '8px', borderRadius: '4px' }}>
                              <strong>Notes:</strong> {compareData.older_version.notes}
                            </div>
                          )}
                        </div>

                        {/* Newer */}
                        <div style={{ padding: '16px', border: '2px solid #7952EC', borderRadius: '8px' }}>
                          <span style={{ fontSize: '11px', background: '#EDE9FE', color: '#6D28D9', padding: '2px 6px', borderRadius: '4px' }}>NEWER REVISION</span>
                          <h4 style={{ margin: '8px 0 4px 0' }}>v{compareData.newer_version?.version}</h4>
                          <div style={{ fontSize: '12px', color: '#666' }}>Submitted: {new Date(compareData.newer_version?.submitted_at).toLocaleString()}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Status: {compareData.newer_version?.status}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Checksum: {compareData.newer_version?.sha256_checksum?.slice(0, 16) || 'N/A'}</div>
                          {compareData.newer_version?.notes && (
                            <div style={{ marginTop: '10px', fontSize: '13px', background: '#F9FAFB', padding: '8px', borderRadius: '4px' }}>
                              <strong>Notes:</strong> {compareData.newer_version.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AI REVIEW */}
              {activeTab === 'ai-review' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>AI-Assisted Quality & Requirement Analysis</h3>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                        Evaluates master deliverables against campaign brief specifications.
                      </p>
                    </div>
                    {latestDeliverable && (
                      <button
                        className="btn-primary"
                        onClick={() => handleRunAiReview()}
                        disabled={aiLoading}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {aiLoading ? 'Analyzing...' : 'Refresh AI Analysis'}
                      </button>
                    )}
                  </div>

                  {aiReport ? (
                    <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #EAE6DF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#7952EC', textTransform: 'uppercase' }}>
                            Model: {aiReport.model_name}
                          </span>
                          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0' }}>{aiReport.summary}</h4>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 18px', background: '#F3E8FF', borderRadius: '8px' }}>
                          <div style={{ fontSize: '26px', fontWeight: 800, color: '#7E22CE' }}>
                            {intOrFloat(aiReport.brief_coverage_score)}%
                          </div>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6B21A8' }}>Coverage Fit</div>
                        </div>
                      </div>

                      {/* Requirement Coverage */}
                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#166534', margin: '0 0 8px 0' }}>✓ Verified Requirements</h5>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                          {aiReport.requirement_coverage?.map((req, i) => <li key={i}>{req}</li>)}
                        </ul>
                      </div>

                      {/* Observations & Suggested Questions */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                        <div>
                          <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 8px 0' }}>🔍 Quality Observations</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#4B5563' }}>
                            {aiReport.quality_observations?.map((obs, i) => <li key={i}>{obs}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 8px 0' }}>❓ Suggested Questions</h5>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#4B5563' }}>
                            {aiReport.suggested_questions?.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '6px', fontSize: '11px', color: '#6B7280', borderLeft: '3px solid #7952EC' }}>
                        <strong>Disclaimer:</strong> {aiReport.disclaimer}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#FFF', padding: '40px', textAlign: 'center', color: '#9CA3AF', borderRadius: '12px' }}>
                      <Sparkles size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <p>No AI analysis has been generated yet for this deliverable.</p>
                      {latestDeliverable && (
                        <button className="btn-primary" onClick={() => handleRunAiReview()} style={{ marginTop: '12px' }}>
                          Analyze Deliverable v{latestDeliverable.version}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: TIMELINE */}
              {activeTab === 'timeline' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Append-Only Activity History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {events.map((evt) => (
                      <div key={evt.id} style={{ background: '#FFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EAE6DF', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ padding: '6px', borderRadius: '50%', background: '#F3F4F6', color: '#7952EC', marginTop: '2px' }}>
                          <Clock size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{evt.title}</span>
                            <span style={{ fontSize: '11px', color: '#999' }}>{new Date(evt.created_at).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{evt.description}</div>
                          <span style={{ fontSize: '10px', background: '#F4F2EC', padding: '2px 6px', borderRadius: '4px', color: '#666', marginTop: '4px', display: 'inline-block' }}>
                            Actor: {evt.actor_role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: REVIEWS & SIGN-OFF */}
              {activeTab === 'reviews' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>Performance Reviews & Completion</h3>
                  {eng?.status !== 'COMPLETED' ? (
                    <div style={{ background: '#FFF', padding: '30px', textAlign: 'center', color: '#666', borderRadius: '8px' }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 10px auto', color: '#F59E0B' }} />
                      <p>Collaboration must be marked <strong>COMPLETED</strong> before reviews can be submitted.</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>Current status: {eng?.status}</p>
                      {isBrand && eng?.status === 'FINAL_APPROVED' && (
                        <button className="btn-primary" onClick={handleComplete} style={{ marginTop: '12px' }}>
                          Complete Collaboration Now
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Form */}
                      <form onSubmit={handleSubmitReview} style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #EAE6DF', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0' }}>
                          Submit Your Review for {isBrand ? workspace.creator?.display_name : workspace.brand?.company_name}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Overall Rating (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              className="input-field"
                              value={reviewRating}
                              onChange={(e) => setReviewRating(parseFloat(e.target.value))}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Communication</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              className="input-field"
                              value={reviewCommRating}
                              onChange={(e) => setReviewCommRating(parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Quality</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              className="input-field"
                              value={reviewQualityRating}
                              onChange={(e) => setReviewQualityRating(parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Timeliness</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.5"
                              className="input-field"
                              value={reviewTimeRating}
                              onChange={(e) => setReviewTimeRating(parseFloat(e.target.value))}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Written Feedback</label>
                          <textarea
                            className="input-field"
                            rows={3}
                            placeholder="Share detailed collaboration feedback..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn-primary" disabled={submittingReview}>
                          {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* SUBMISSION MODAL */}
        {showSubmitModal && (
          <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={() => setShowSubmitModal(false)}>
            <div className="modal-container glass-panel max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Submit Deliverable Draft</h3>
                <button className="modal-close-btn" onClick={() => setShowSubmitModal(false)}>✕</button>
              </div>
              <form onSubmit={handleDeliverableSubmit} style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Master 4K Cinematic Cut"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Upload Asset File</label>
                  <input
                    type="file"
                    className="input-field"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </div>
                {!selectedFile && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Or Asset Link / URL</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="https://assets.example.com/render.mp4"
                      value={submitAssetUrl}
                      onChange={(e) => setSubmitAssetUrl(e.target.value)}
                    />
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Submission Notes</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Describe what changed in this version..."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REVISION REQUEST MODAL */}
        {showRevisionModal && (
          <div className="modal-backdrop" style={{ zIndex: 1300 }} onClick={() => setShowRevisionModal(false)}>
            <div className="modal-container glass-panel max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Request Deliverable Changes</h3>
                <button className="modal-close-btn" onClick={() => setShowRevisionModal(false)}>✕</button>
              </div>
              <form onSubmit={handleRequestRevision} style={{ padding: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Specific Revision Instructions</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Detail the adjustments required (e.g., color grade saturation, end card typography)..."
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowRevisionModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submittingRevision}>
                    {submittingRevision ? 'Sending...' : 'Send Revision Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function intOrFloat(val) {
  if (val === undefined || val === null) return 0;
  return Math.round(val);
}
