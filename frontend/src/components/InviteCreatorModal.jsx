import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function InviteCreatorModal({ creator, isOpen, onClose, onSuccess }) {
  const [briefs, setBriefs] = useState([]);
  const [selectedBriefId, setSelectedBriefId] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchBriefsData = () => {
    setError(null);
    setSuccess(false);
    setMessage('');
    setIsLoading(true);

    const getBriefsPromise = api.getMyBriefs ? api.getMyBriefs() : api.getBriefs();
    getBriefsPromise
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.items || data.briefs || []);
        // Filter to active, open, published, or draft briefs authored by brand
        const eligible = list.filter((b) => {
          const st = (b.status || '').toUpperCase();
          return ['ACTIVE', 'PUBLISHED', 'OPEN', 'DRAFT', 'REVIEWING_APPLICATIONS', 'IN_PROGRESS'].includes(st);
        });
        setBriefs(eligible);
        if (eligible.length > 0) {
          setSelectedBriefId(eligible[0].id);
          setProposedRate(eligible[0].budget_amount || '');
        }
      })
      .catch((err) => {
        setError(err.message || 'Could not load your active campaign briefs.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchBriefsData();
    }
  }, [isOpen]);

  const handleBriefChange = (briefId) => {
    setSelectedBriefId(briefId);
    const b = briefs.find((item) => item.id === briefId);
    if (b) {
      setProposedRate(b.budget_amount || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBriefId) {
      setError('Please select an active campaign brief.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.inviteCreator({
        creator_id: creator.id,
        brief_id: selectedBriefId,
        message: message.trim() || undefined,
        proposed_rate: proposedRate ? parseFloat(proposedRate) : undefined,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to dispatch creator invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !creator) return null;

  const selectedBrief = briefs.find((b) => b.id === selectedBriefId);

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-container"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #EAE6DF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F0ECE4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF8F5',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>
              Invite Creator to Brief
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
              Direct invitation to collaborate with <strong style={{ color: '#7952EC' }}>{creator.display_name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🎉</span>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#16A34A' }}>
                Invitation Sent Successfully!
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {creator.display_name} has been notified and can review the campaign scope.
              </p>
            </div>
          ) : isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#888', fontSize: '14px' }}>
              Loading your active briefs...
            </div>
          ) : error && briefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⚠️</span>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#DC2626' }}>
                Failed to Load Campaign Briefs
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
                {error}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={fetchBriefsData}
                  className="btn-primary"
                  style={{
                    backgroundColor: '#7952EC',
                    color: '#FFFFFF',
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Retry Loading
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#F0ECE4',
                    color: '#333',
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : briefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📋</span>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#111' }}>
                No Open Campaign Briefs Found
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
                You must publish an active brief before inviting creators to collaborate.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Select Brief */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Select Campaign Brief *
                </label>
                <select
                  value={selectedBriefId}
                  onChange={(e) => handleBriefChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #D6D0C4',
                    fontSize: '14px',
                    background: '#FFF',
                  }}
                >
                  {briefs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (${(b.budget_amount || 0).toLocaleString()} • {b.content_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Brief Summary Box */}
              {selectedBrief && (
                <div
                  style={{
                    backgroundColor: '#F8F7F4',
                    border: '1px solid #EAE6DF',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: '#555',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '600', color: '#222' }}>
                    <span>Budget: ${(selectedBrief.budget_amount || 0).toLocaleString()}</span>
                    <span>Format: {selectedBrief.aspect_ratio || '16:9'}</span>
                  </div>
                  <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedBrief.campaign_objective || selectedBrief.deliverables_description || 'Creative campaign brief'}
                  </p>
                </div>
              )}

              {/* Proposed Rate */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Proposed Rate (USD)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  placeholder="e.g. 3500"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #D6D0C4',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Custom Pitch Message */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Personalized Invitation Note (Optional)
                </label>
                <textarea
                  rows="3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi Elena, we love your recent 3D commercial work and would love to partner on this upcoming brand launch..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #D6D0C4',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #D6D0C4',
                    background: '#FFF',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#7952EC',
                    color: '#FFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Sending Invitation...' : 'Send Invitation ✉️'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
