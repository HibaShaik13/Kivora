import React, { useEffect, useState } from 'react';
import { X, Sparkle, ShieldCheck, CheckCircle, WarningCircle, User, ArrowRight } from '@phosphor-icons/react';
import { matchingApi } from '../../api/matching';
import { Link } from 'react-router-dom';

export default function ExplainableMatchDrawer({ isOpen, onClose, brief }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    if (!isOpen || !brief) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await matchingApi.getBriefMatches(brief.id);
        setMatchData(data);
      } catch (err) {
        console.error('Failed to fetch creator matches:', err);
        setError(err.message || 'Failed to compute creator matches for this brief.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isOpen, brief]);

  if (!isOpen || !brief) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 23, 21, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-warm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Sparkle size={16} weight="fill" style={{ color: 'var(--accent-coral)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-coral)' }}>
                Explainable Matching Engine
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
              Creator Matches: {brief.title}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Evaluating creator portfolio workflows, prompt mastery & budget compatibility...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--accent-coral-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--accent-coral-border)',
                color: 'var(--accent-coral)',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          ) : matchData ? (
            <div>
              {/* Summary Stats */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Evaluated <strong>{matchData.total_creators_evaluated || 0}</strong> verified creators</span>
                <span><strong>{matchData.matches?.length || 0}</strong> matched candidates</span>
              </div>

              {/* Match List */}
              {matchData.matches?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)' }}>
                  <p>No creator matches found with the current brief criteria.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {matchData.matches.map((m, idx) => (
                    <div
                      key={m.creator_id || idx}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: '#FFFFFF',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                    >
                      {/* Creator Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent-lavender-subtle)',
                              color: 'var(--accent-lavender)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {m.display_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                                {m.display_name}
                              </span>
                              {m.verification_tier && m.verification_tier !== 'COMMUNITY' && (
                                <span className="badge badge-verified" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                                  {m.verification_tier}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              @{m.handle} • {m.primary_specialization || 'AI Creator'}
                            </div>
                          </div>
                        </div>
                        {/* Match Score Badge */}
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: m.score >= 80 ? 'var(--status-verified-bg)' : m.score >= 60 ? 'var(--status-info-bg)' : 'var(--accent-coral-subtle)',
                              color: m.score >= 80 ? 'var(--status-verified)' : m.score >= 60 ? 'var(--accent-lavender)' : 'var(--accent-coral)',
                              fontWeight: 800,
                              fontSize: '0.9375rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Sparkle size={15} weight="fill" />
                            <span>{Math.round(m.score || 0)}% MATCH</span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {m.match_level || 'EVALUATED'}
                          </div>
                        </div>
                      </div>

                      {/* Hard Requirements Banner */}
                      {!m.hard_requirements_met && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--status-error-bg)',
                            color: 'var(--status-error)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px',
                          }}
                        >
                          <WarningCircle size={15} />
                          <span>Fails hard gate requirements (Content format or Budget ceiling)</span>
                        </div>
                      )}

                      {/* Compatibility Breakdown Bars */}
                      {m.breakdown && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>Skills (35%)</span>
                              <strong>{Math.round(m.breakdown.skill_score || 0)}%</strong>
                            </div>
                            <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, Math.round(m.breakdown.skill_score || 0))}%`, backgroundColor: 'var(--accent-lavender)' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>Tools (25%)</span>
                              <strong>{Math.round(m.breakdown.tool_score || 0)}%</strong>
                            </div>
                            <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, Math.round(m.breakdown.tool_score || 0))}%`, backgroundColor: 'var(--accent-coral)' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>Style (20%)</span>
                              <strong>{Math.round(m.breakdown.style_score || 0)}%</strong>
                            </div>
                            <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, Math.round(m.breakdown.style_score || 0))}%`, backgroundColor: '#3B82F6' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>Audit (15%)</span>
                              <strong>{Math.round(m.breakdown.verification_score || 0)}%</strong>
                            </div>
                            <div style={{ height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, Math.round(m.breakdown.verification_score || 0))}%`, backgroundColor: '#10B981' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Matched Skills & Tools */}
                      {((m.matched_skills && m.matched_skills.length > 0) || (m.matched_tools && m.matched_tools.length > 0)) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                          {m.matched_skills?.map((sk, skIdx) => (
                            <span key={skIdx} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                              ✓ {sk}
                            </span>
                          ))}
                          {m.matched_tools?.map((tl, tlIdx) => (
                            <span key={tlIdx} className="badge badge-verified" style={{ fontSize: '0.6875rem' }}>
                              ✓ {tl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Match Strengths & Explanations */}
                      {m.reasons && m.reasons.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Score Contributors:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {m.reasons.slice(0, 4).map((r, rIdx) => (
                              <li key={rIdx} style={{ marginBottom: '2px' }}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Gaps if any */}
                      {m.gaps && m.gaps.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-error)', marginBottom: '4px' }}>
                            Requirement Gaps:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--status-error)', lineHeight: 1.4 }}>
                            {m.gaps.slice(0, 3).map((g, gIdx) => (
                              <li key={gIdx} style={{ marginBottom: '2px' }}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '10px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Min Fee: ${m.min_budget?.toLocaleString()} USD
                        </div>
                        <Link
                          to={`/creators/${m.handle || m.creator_id}`}
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                          target="_blank"
                        >
                          <span>Inspect Portfolio</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              {matchData.matches?.[0]?.compatibility_disclaimer && (
                <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.6875rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                  ℹ️ {matchData.matches[0].compatibility_disclaimer}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
