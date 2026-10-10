import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export default function AdminDashboard({ currentUser, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminVerificationRequests(statusFilter || undefined);
      setRequests(data || []);
      if (data?.length > 0 && !selectedReq) {
        setSelectedReq(data[0]);
      } else if (selectedReq) {
        const updated = data.find((r) => r.id === selectedReq.id);
        if (updated) setSelectedReq(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to load verification requests.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, selectedReq]);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleRunAiAnalysis = async (verId) => {
    setAnalyzingId(verId);
    setError(null);
    try {
      const analysis = await api.analyzeVerificationAi(verId);
      setRequests((prev) =>
        prev.map((r) => (r.id === verId ? { ...r, ai_analysis: analysis } : r))
      );
      if (selectedReq && selectedReq.id === verId) {
        setSelectedReq((prev) => ({ ...prev, ai_analysis: analysis }));
      }
      setSuccessMsg('Gemini AI Evidence Audit completed successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to execute AI analysis.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleReview = async (verId, newStatus) => {
    setIsSubmittingReview(true);
    setError(null);
    try {
      const updated = await api.reviewVerificationRequest(verId, {
        status: newStatus,
        reviewer_notes: reviewNotes || `Audited and verified by Lead Administrator (${newStatus}).`,
      });
      setRequests((prev) => prev.map((r) => (r.id === verId ? updated : r)));
      setSelectedReq(updated);
      setReviewNotes('');
      setSuccessMsg(`Verification status updated to: ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Review action failed.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div
      className="admin-dashboard-layout"
      style={{
        backgroundImage: 'linear-gradient(rgba(250, 247, 242, 0.94), rgba(250, 247, 242, 0.94)), url(/assets/backgrounds/verification.jpg)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between mb-8">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              LEAD AUDIT DESK
            </span>
            <h1 className="text-2xl font-serif font-bold text-neutral-900 mt-1">
              Platform Verification & <span className="serif-italic-accent">Integrity Audit</span>
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Signed in as <strong>{currentUser?.email}</strong> (Administrator) • Review creator reproducibility proof and run Gemini audits.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={loadRequests} className="btn-secondary text-xs">
              ↻ Refresh Audit Queue
            </button>
            <button type="button" onClick={onLogout} className="btn-secondary text-xs text-red-600">
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs">
            {successMsg}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mb-6">
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white/80 text-neutral-700 hover:bg-white border border-black/10'
              }`}
            >
              {st === '' ? 'All Queue Requests' : st}
            </button>
          ))}
        </div>

        {/* Two-Column Audit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Request List */}
          <div className="lg:col-span-1 glass-panel p-4 rounded-2xl max-h-[75vh] overflow-y-auto space-y-3">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Submitted Proof Records ({requests.length})
            </h3>

            {isLoading && requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">No requests in this queue.</div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1.5 ${
                    selectedReq?.id === req.id
                      ? 'border-purple-600 bg-purple-50/80 shadow-sm'
                      : 'border-black/5 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(req.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-neutral-900">{req.creator_name || 'Creator'}</h4>
                  <p className="text-neutral-500 line-clamp-1">{req.verification_scope}</p>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Detailed Audit Workspace */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            {selectedReq ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-black/10">
                  <div>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      AUDIT-ID: {selectedReq.id}
                    </span>
                    <h2 className="text-xl font-serif font-bold text-neutral-900 mt-2">
                      {selectedReq.verification_scope}
                    </h2>
                    <p className="text-xs text-neutral-600 mt-1">
                      Creator: <strong>{selectedReq.creator_name}</strong> (@{selectedReq.creator_handle}) • Target: {selectedReq.target_type}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      selectedReq.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedReq.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    STATUS: {selectedReq.status}
                  </span>
                </div>

                {/* Evidence Asset Preview */}
                <div className="p-4 rounded-xl bg-white/70 border border-black/5 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Attached Evidence File
                  </h4>
                  <p className="text-xs font-semibold text-neutral-900">{selectedReq.evidence_title}</p>
                  <p className="text-xs font-mono text-purple-700 truncate">{selectedReq.evidence_file_url}</p>
                  {selectedReq.evidence_file_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-black/10 max-h-64 bg-neutral-900 flex items-center justify-center">
                      <img
                        src={selectedReq.evidence_file_url}
                        alt="Evidence Proof"
                        className="max-h-64 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Gemini AI Analysis Section */}
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                      ✨ Gemini AI Multimodal Evidence Analysis
                    </h4>
                    <button
                      type="button"
                      disabled={analyzingId === selectedReq.id}
                      onClick={() => handleRunAiAnalysis(selectedReq.id)}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      {analyzingId === selectedReq.id ? 'Analyzing with Gemini...' : 'Run / Re-run Gemini AI Audit'}
                    </button>
                  </div>

                  {selectedReq.ai_analysis ? (
                    <div className="text-xs space-y-2 text-neutral-800">
                      <p className="font-medium">{selectedReq.ai_analysis.summary}</p>
                      {selectedReq.ai_analysis.evidence_items_detected?.length > 0 && (
                        <div>
                          <strong className="text-emerald-700">Detected Items:</strong>{' '}
                          {selectedReq.ai_analysis.evidence_items_detected.join(', ')}
                        </div>
                      )}
                      {selectedReq.ai_analysis.potential_inconsistencies?.length > 0 && (
                        <div>
                          <strong className="text-amber-800">Potential Inconsistencies:</strong>{' '}
                          {selectedReq.ai_analysis.potential_inconsistencies.join(', ')}
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-500 italic mt-2">
                        {selectedReq.ai_analysis.disclaimer || 'AI analysis provides non-binding verification support.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      No automated AI audit record yet. Click "Run Gemini AI Audit" to extract node graph parameters and detect inconsistencies.
                    </p>
                  )}
                </div>

                {/* Human Auditor Decision Desk */}
                <div className="p-4 rounded-xl bg-white/70 border border-black/5 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Human Auditor Decision
                  </h4>
                  <textarea
                    className="input-text w-full text-xs"
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter audit rationale (e.g. Prompt parameters reproducible, noise schedule verified)..."
                  />
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={() => handleReview(selectedReq.id, 'REJECTED')}
                      className="btn-secondary text-xs text-red-600 hover:bg-red-50"
                    >
                      Reject Claim
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={() => handleReview(selectedReq.id, 'APPROVED')}
                      className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve & Verify Claim ✓
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-xs text-neutral-400">
                Select a verification request from the queue to inspect evidence and execute audits.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
