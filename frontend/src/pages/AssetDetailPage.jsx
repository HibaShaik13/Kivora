import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowSquareOut,
  DownloadSimple,
  Copy,
  Check,
  FileText,
  VideoCamera,
  Image as ImageIcon,
  FileZip,
  Clock,
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  ArrowsClockwise,
  LockKey,
  CalendarBlank,
  Tag,
} from '@phosphor-icons/react';
import { engagementsApi } from '../api/engagements';
import { getMediaUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function AssetDetailPage() {
  const { deliverableId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // 404, 403, or 500
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const fetchDeliverable = async () => {
    if (!deliverableId) return;
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    setMediaError(false);

    try {
      const data = await engagementsApi.getDeliverable(deliverableId);
      setDeliverable(data);
    } catch (err) {
      console.error('Failed to fetch deliverable asset:', err);
      const status = err.status || (err.message?.includes('404') ? 404 : err.message?.includes('403') ? 403 : 500);
      setErrorStatus(status);
      setErrorMessage(err.message || 'Unable to retrieve asset deliverable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverable();
  }, [deliverableId]);

  const resolvedUrl = useMemo(() => {
    if (!deliverable?.asset_url) return '';
    return getMediaUrl(deliverable.asset_url);
  }, [deliverable]);

  const fileType = useMemo(() => {
    if (!deliverable?.asset_url) return 'generic';
    const urlWithoutQuery = deliverable.asset_url.split('?')[0].toLowerCase();
    if (urlWithoutQuery.match(/\.(mp4|webm|mov|m4v|mkv|avi)$/i)) return 'video';
    if (urlWithoutQuery.match(/\.(png|jpg|jpeg|webp|gif|svg|avif)$/i)) return 'image';
    if (urlWithoutQuery.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) return 'audio';
    if (urlWithoutQuery.match(/\.(zip|tar|gz|rar|7z)$/i)) return 'archive';
    if (urlWithoutQuery.match(/\.(pdf|doc|docx|txt)$/i)) return 'document';
    return 'generic';
  }, [deliverable]);

  const handleCopyLink = () => {
    if (!resolvedUrl) return;
    navigator.clipboard.writeText(resolvedUrl).then(() => {
      setCopied(true);
      showToast('Asset link copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getDashboardPath = () => {
    if (user?.role === 'CREATOR') return '/creator/dashboard';
    if (user?.role === 'BRAND') return '/brand/dashboard';
    if (user?.role === 'ADMIN') return '/admin/verification';
    return '/';
  };

  // Loading State
  if (loading) {
    return (
      <div style={{ padding: '80px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--accent-lavender)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Loading deliverable asset...</p>
        </div>
      </div>
    );
  }

  // 404 / 403 / Error State
  if (errorStatus || !deliverable) {
    const is404 = errorStatus === 404;
    const is403 = errorStatus === 403;

    return (
      <div style={{ padding: '80px 0 120px' }}>
        <div className="container-narrow" style={{ maxWidth: '580px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: is403 ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-coral-subtle)',
              color: is403 ? 'var(--status-error)' : 'var(--accent-coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            {is403 ? <LockKey size={32} weight="duotone" /> : <WarningCircle size={32} weight="duotone" />}
          </div>

          <span
            className={`badge ${is403 ? 'badge-coral' : 'badge-coral'}`}
            style={{ marginBottom: '12px' }}
          >
            {is403 ? '403 Access Denied' : is404 ? '404 Not Found' : 'Asset Error'}
          </span>

          <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            {is403
              ? 'Private Asset Deliverable'
              : is404
              ? 'Asset Not Found'
              : 'Unable to Retrieve Asset'}
          </h1>

          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
            {is403
              ? 'You do not have permission to view or download this deliverable. Only the assigned creator and brand client may access this asset.'
              : is404
              ? `The asset deliverable with ID "${deliverableId}" does not exist, has been removed, or has not been uploaded yet.`
              : (errorMessage || 'An unexpected error occurred while loading this asset deliverable.')}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            <Link
              to={getDashboardPath()}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Asset Detail Page
  return (
    <div style={{ padding: '40px 0 100px' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Top Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                fontSize: '0.875rem',
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <span style={{ color: 'var(--border-subtle)', userSelect: 'none' }}>/</span>
            <Link
              to={getDashboardPath()}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
            <span style={{ color: 'var(--border-subtle)', userSelect: 'none' }}>/</span>
            <span
              style={{
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-family-mono)',
              }}
            >
              {deliverable.id}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopyLink}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                padding: '8px 14px',
              }}
              title="Copy public asset link"
            >
              {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>

            {resolvedUrl && (
              <a
                href={resolvedUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8125rem',
                  padding: '8px 16px',
                }}
              >
                <DownloadSimple size={16} />
                Download Asset
              </a>
            )}
          </div>
        </div>

        {/* Header Block */}
        <div
          className="card-editorial"
          style={{
            padding: '28px 32px',
            marginBottom: '28px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span
                  className="badge badge-lavender"
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Version {deliverable.version}
                </span>

                <span
                  className={`badge ${
                    deliverable.status === 'APPROVED'
                      ? 'badge-verified'
                      : deliverable.status === 'REVISION_REQUESTED'
                      ? 'badge-coral'
                      : 'badge-submitted'
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {deliverable.status}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Tag size={12} />
                  {fileType.toUpperCase()}
                </span>
              </div>

              <h1 style={{ fontSize: '1.875rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {deliverable.title || 'Deliverable Asset Package'}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  flexWrap: 'wrap',
                }}
              >
                {deliverable.submitted_at && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarBlank size={14} />
                    Submitted: {new Date(deliverable.submitted_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
                {deliverable.reviewed_at && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    Reviewed: {new Date(deliverable.reviewed_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>

            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8125rem',
                }}
              >
                <ArrowSquareOut size={16} />
                Open Direct URL
              </a>
            )}
          </div>
        </div>

        {/* Media Preview Box */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
              {fileType === 'video' ? (
                <VideoCamera size={18} color="var(--accent-lavender)" />
              ) : fileType === 'image' ? (
                <ImageIcon size={18} color="var(--accent-lavender)" />
              ) : (
                <FileText size={18} color="var(--accent-lavender)" />
              )}
              <span>Asset Preview</span>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-family-mono)' }}>
              {deliverable.asset_url}
            </span>
          </div>

          <div
            style={{
              padding: '32px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px',
              background: 'radial-gradient(circle at center, rgba(30, 30, 45, 0.5) 0%, rgba(10, 10, 18, 0.9) 100%)',
            }}
          >
            {mediaError ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '440px' }}>
                <WarningCircle size={44} color="var(--accent-coral)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.125rem', marginBottom: '8px' }}>Preview Not Available Inline</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: '1.5' }}>
                  This asset cannot be previewed in the embedded player. You can download or view it directly in a new window.
                </p>
                {resolvedUrl && (
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}
                  >
                    <ArrowSquareOut size={16} />
                    Open Original Asset
                  </a>
                )}
              </div>
            ) : fileType === 'video' ? (
              <video
                controls
                playsInline
                preload="metadata"
                src={resolvedUrl}
                onError={() => setMediaError(true)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '620px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  outline: 'none',
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : fileType === 'image' ? (
              <img
                src={resolvedUrl}
                alt={deliverable.title || 'Deliverable Asset Preview'}
                onError={() => setMediaError(true)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '620px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              />
            ) : fileType === 'audio' ? (
              <div style={{ textAlign: 'center', width: '100%', maxWidth: '500px', padding: '24px' }}>
                <audio
                  controls
                  src={resolvedUrl}
                  onError={() => setMediaError(true)}
                  style={{ width: '100%' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '440px' }}>
                {fileType === 'archive' ? (
                  <FileZip size={54} color="var(--accent-lavender)" style={{ margin: '0 auto 16px' }} />
                ) : (
                  <FileText size={54} color="var(--accent-lavender)" style={{ margin: '0 auto 16px' }} />
                )}
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Deliverable Package</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  This file is an external deliverable archive or package. Click below to download or inspect the package contents.
                </p>
                {resolvedUrl && (
                  <a
                    href={resolvedUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}
                  >
                    <DownloadSimple size={16} />
                    Download File
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deliverable Metadata & Feedback Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Submission Notes Card */}
          <div
            style={{
              padding: '24px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.9375rem', fontWeight: 600 }}>
              <FileText size={18} color="var(--accent-lavender)" />
              <span>Submission Notes</span>
            </div>
            {deliverable.notes ? (
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {deliverable.notes}
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                No creator submission notes provided for this version.
              </p>
            )}
          </div>

          {/* Review Feedback Card */}
          <div
            style={{
              padding: '24px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.9375rem', fontWeight: 600 }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              <span>Client Review & Feedback</span>
            </div>
            {deliverable.feedback ? (
              <p style={{ color: 'var(--accent-coral)', lineHeight: '1.6', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {deliverable.feedback}
              </p>
            ) : deliverable.status === 'APPROVED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontSize: '0.875rem' }}>
                <CheckCircle size={18} />
                <span>Deliverable approved with no outstanding revision requests.</span>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                Pending brand review feedback.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
