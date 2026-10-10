import React, { useState, useEffect } from 'react';
import { verificationService } from '../services/verificationService';
import { getCurrentUser } from '../services/authService';

export default function AdminVerificationModal({ isOpen, onClose }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await verificationService.listAdminRequests(statusFilter || undefined);
      setRequests(data);
      if (data.length > 0 && !selectedReq) {
        setSelectedReq(data[0]);
      } else if (selectedReq) {
        // Refresh selected req with latest data
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
    if (isOpen && isAdmin) {
      loadRequests();
    }
  }, [isOpen, statusFilter, isAdmin, loadRequests]);

  const handleRunAiAnalysis = async (verId) => {
    setAnalyzingId(verId);
    setError(null);
    try {
      const analysis = await verificationService.triggerAiAnalysis(verId);
      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r.id === verId ? { ...r, ai_analysis: analysis } : r))
      );
      if (selectedReq && selectedReq.id === verId) {
        setSelectedReq((prev) => ({ ...prev, ai_analysis: analysis }));
      }
      setSuccessMsg('Gemini Evidence Audit completed successfully.');
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
      const updated = await verificationService.reviewRequest(
        verId,
        newStatus,
        reviewNotes || `Audited and verified by Lead Administrator (${newStatus}).`
      );
      setRequests((prev) => prev.map((r) => (r.id === verId ? updated : r)));
      setSelectedReq(updated);
      setReviewNotes('');
      setSuccessMsg(`Verification claim status updated to: ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Review action failed.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="badge-verified text-sm px-3 py-1 font-mono">
              🛡 TRUST & VERIFICATION DESK
            </span>
            <h2 className="text-xl font-bold text-white">Administrative Evidence Audit</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal-body">
          {!isAdmin ? (
            <div className="p-8 text-center space-y-4">
              <div className="text-4xl">🔒</div>
              <h3 className="text-lg font-bold text-white">Administrator Access Required</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Only authenticated platform administrators can review creator verification evidence and execute multimodal Gemini audits.
              </p>
              <p className="text-xs text-brand-cyan">
                Click <strong>"Role: Admin"</strong> in the top-right navbar Demo Switcher to log in as the Lead Reviewer instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="banner-error">
                  <span className="font-semibold">Notice:</span> {error}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs">
                  {successMsg}
                </div>
              )}

              {/* Filter bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-semibold">Filter Claims:</span>
                  {['', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`text-xs px-3 py-1 rounded transition ${
                        statusFilter === st
                          ? 'bg-brand-cyan text-black font-semibold'
                          : 'bg-surface-2 text-neutral-300 hover:bg-surface-3'
                      }`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st || 'All Claims'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {requests.length} claim{requests.length !== 1 ? 's' : ''} queued
                </span>
              </div>

              {/* 2-column desk */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[480px]">
                {/* Left: claim list */}
                <div className="md:col-span-4 border-r border-white/10 pr-4 space-y-2 max-h-[520px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-xs text-neutral-400">Loading audit queue...</div>
                  ) : requests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No claims found for selected filter.
                    </div>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReq(r)}
                        className={`p-3 rounded-lg cursor-pointer transition border text-left ${
                          selectedReq && selectedReq.id === r.id
                            ? 'bg-surface-3 border-brand-cyan/40 shadow-sm'
                            : 'bg-surface-1 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white truncate max-w-[150px]">
                            {r.creator_name || 'Creator'}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              r.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-300 truncate">
                          Target: <code className="text-brand-cyan">{r.target_id}</code>
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                          Project: {r.project_title || 'Untitled Project'}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right: detailed inspection */}
                <div className="md:col-span-8 space-y-4 max-h-[520px] overflow-y-auto pl-2">
                  {selectedReq ? (
                    <div className="space-y-4">
                      {/* Meta header */}
                      <div className="p-4 bg-surface-2 rounded-lg border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-white">
                              {selectedReq.creator_name} ({selectedReq.creator_handle})
                            </h3>
                            <span className="text-xs text-neutral-400">
                              Claim ID: <code className="font-mono">{selectedReq.id}</code>
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs font-mono font-bold px-2.5 py-1 rounded inline-block ${
                                selectedReq.status === 'APPROVED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : selectedReq.status === 'REJECTED'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              STATUS: {selectedReq.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/5">
                          <div>
                            <span className="text-neutral-400">Target Type:</span>{' '}
                            <span className="text-white font-mono">{selectedReq.target_type}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Target ID:</span>{' '}
                            <span className="text-brand-cyan font-mono">{selectedReq.target_id}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Project:</span>{' '}
                            <span className="text-white">{selectedReq.project_title}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Evidence Record:</span>{' '}
                            <span className="text-white">{selectedReq.evidence_title}</span>
                          </div>
                        </div>

                        {selectedReq.evidence_file_url && (
                          <div className="pt-2 text-xs">
                            <span className="text-neutral-400">Attached Media: </span>
                            <a
                              href={selectedReq.evidence_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-cyan underline font-mono hover:text-white"
                            >
                              {selectedReq.evidence_file_url} ↗
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Gemini Evidence Audit Box */}
                      <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="badge-ai text-xs px-2.5 py-0.5 font-mono">
                              ✦ GEMINI EVIDENCE AUDIT
                            </span>
                            {selectedReq.ai_analysis && (
                              <span className="text-xs text-neutral-400 font-mono">
                                Model: {selectedReq.ai_analysis.model_name}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRunAiAnalysis(selectedReq.id)}
                            disabled={analyzingId === selectedReq.id}
                            className="text-xs bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan px-3 py-1.5 rounded font-medium transition border border-brand-cyan/30 flex items-center gap-1.5"
                          >
                            {analyzingId === selectedReq.id ? (
                              <>
                                <div className="spinner-sm" />
                                Auditing Evidence...
                              </>
                            ) : (
                              <>✦ Run Gemini Evidence Audit</>
                            )}
                          </button>
                        </div>

                        {selectedReq.ai_analysis ? (
                          <div className="space-y-3 pt-2 text-xs">
                            <div>
                              <span className="text-neutral-400 font-semibold block mb-1">
                                Synthesis & Summary:
                              </span>
                              <p className="text-neutral-200 bg-surface-1 p-2.5 rounded border border-white/5 leading-relaxed">
                                {selectedReq.ai_analysis.summary}
                              </p>
                            </div>

                            {/* Detected items */}
                            <div>
                              <span className="text-neutral-400 font-semibold block mb-1">
                                Detected Evidence Items:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedReq.ai_analysis.evidence_items_detected?.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]"
                                  >
                                    ✓ {item}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Missing items */}
                            {selectedReq.ai_analysis.missing_evidence?.length > 0 && (
                              <div>
                                <span className="text-neutral-400 font-semibold block mb-1">
                                  Missing Evidence Requirements:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedReq.ai_analysis.missing_evidence.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[11px]"
                                    >
                                      ✕ {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Inconsistencies */}
                            {selectedReq.ai_analysis.potential_inconsistencies?.length > 0 && (
                              <div>
                                <span className="text-neutral-400 font-semibold block mb-1">
                                  Flagged Inconsistencies / Observations:
                                </span>
                                <div className="space-y-1">
                                  {selectedReq.ai_analysis.potential_inconsistencies.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20"
                                    >
                                      ⚠ {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mandatory Disclaimer */}
                            <div className="text-[10px] text-neutral-400 bg-white/5 p-2 rounded border border-white/5 italic">
                              {selectedReq.ai_analysis.disclaimer ||
                                'AI evidence analysis assists authorized human reviewers. It does not replace independent verification or constitute proof of authorship.'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-xs text-neutral-400 bg-surface-1 rounded border border-white/5">
                            No AI analysis report stored for this claim yet. Click "Run Gemini Evidence Audit" above to analyze the evidence schema against platform verification rubrics.
                          </div>
                        )}
                      </div>

                      {/* Review Decision Controls */}
                      <div className="p-4 bg-surface-2 rounded-lg border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                          Human Reviewer Audit Decision
                        </h4>
                        <div>
                          <label className="label-form">Reviewer Audit Notes / Findings</label>
                          <textarea
                            className="input-textarea h-20 text-xs"
                            placeholder="Enter notes on evidence fidelity, toolchain consistency, or reasons for approval/rejection..."
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleReview(selectedReq.id, 'REJECTED')}
                            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-4 py-2 rounded font-semibold transition"
                          >
                            Reject Claim ✕
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleReview(selectedReq.id, 'APPROVED')}
                            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded font-semibold transition"
                          >
                            Approve & Certify Toolchain ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-xs text-neutral-400">
                      Select a claim from the queue to inspect attached evidence and run audits.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
