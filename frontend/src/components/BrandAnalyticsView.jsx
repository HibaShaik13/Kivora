import React from 'react';
import { formatINR } from '../utils/indianLocalization';

export default function BrandAnalyticsView({
  profile,
  briefs = [],
  applications = [],
  engagements = [],
  hiredCreators = [],
  savedCreators = [],
  onNavigate,
  onOpenCreateBrief,
  isLoading = false,
  error = null,
  onRetry,
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="portal-header-row">
          <div>
            <span className="text-xs text-neutral-500 font-sans block mb-0.5">Campaign Intelligence</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
              Brand Analytics
            </h1>
          </div>
        </div>
        <div className="py-16 text-center text-xs text-neutral-400 bg-white border border-[#EAE6DF] rounded-2xl shadow-xs">
          Loading brand performance metrics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="portal-header-row">
          <div>
            <span className="text-xs text-neutral-500 font-sans block mb-0.5">Campaign Intelligence</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
              Brand Analytics
            </h1>
          </div>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="text-red-700 text-xs font-semibold mb-3">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="portal-btn-primary px-4 py-2 text-xs font-bold rounded-xl text-white"
              style={{ backgroundColor: '#7952EC' }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Real Metric Calculations
  const totalBudget = briefs.reduce(
    (sum, b) => sum + (parseFloat(b.budget_amount) || 0),
    0
  );
  const totalCommitted = engagements.reduce(
    (sum, e) => sum + (parseFloat(e.agreed_amount) || 0),
    0
  );

  const totalApplications = applications.length;
  const acceptedApplications = applications.filter((a) => a.status === 'ACCEPTED').length;
  const pendingApplications = applications.filter((a) => a.status === 'PENDING').length;
  const rejectedApplications = applications.filter((a) => a.status === 'REJECTED').length;

  const acceptanceRate =
    totalApplications > 0
      ? ((acceptedApplications / totalApplications) * 100).toFixed(1)
      : '0.0';

  const activeBriefsCount = briefs.filter(
    (b) => b.status === 'ACTIVE' || b.status === 'OPEN'
  ).length;

  const activeEngagementsCount = engagements.filter(
    (e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED'
  ).length;

  // Domain Distribution
  const domainCounts = briefs.reduce((acc, b) => {
    const domain = b.content_type || 'VIDEO';
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="portal-header-row">
        <div>
          <span className="text-xs text-neutral-500 font-sans block mb-0.5">Campaign Intelligence</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
            Brand Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-sans">
            Overview of campaign budgets, creator proposal volumes, and collaboration milestones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {onOpenCreateBrief && (
            <button
              type="button"
              className="portal-btn-primary"
              onClick={onOpenCreateBrief}
            >
              <span>+ Create Brief</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Pastel Stat Cards */}
      <div className="portal-stat-grid">
        {/* 1. Campaign Budget (Pastel Lavender) */}
        <div className="portal-stat-card lavender">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#F3E2FD', color: '#683EE6' }}>
              💼
            </div>
            <span className="portal-stat-title">Campaign Budget</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {formatINR(totalBudget)}
            </div>
            <div className="portal-stat-subtitle">
              {formatINR(totalCommitted)} committed to {engagements.length} contracts
            </div>
          </div>
        </div>

        {/* 2. Creator Pitches Received (Pastel Mint) */}
        <div className="portal-stat-card mint">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#DBF7E9', color: '#059669' }}>
              📝
            </div>
            <span className="portal-stat-title">Creator Pitches</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {totalApplications}
            </div>
            <div className="portal-stat-subtitle">
              {pendingApplications} pending review • {acceptanceRate}% acceptance
            </div>
          </div>
        </div>

        {/* 3. Active Collaborations (Pastel Amber) */}
        <div className="portal-stat-card amber">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              🤝
            </div>
            <span className="portal-stat-title">Active Contracts</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {activeEngagementsCount}
            </div>
            <div className="portal-stat-subtitle">
              {hiredCreators.length} verified creators currently engaged
            </div>
          </div>
        </div>

        {/* 4. Published Briefs (Pastel Sky) */}
        <div className="portal-stat-card sky">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              ⚡
            </div>
            <span className="portal-stat-title">Campaign Briefs</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {briefs.length}
            </div>
            <div className="portal-stat-subtitle">
              {activeBriefsCount} active briefs accepting pitches
            </div>
          </div>
        </div>
      </div>

      {/* Pitch Review Funnel & Domain Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal Funnel Card (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Application Review Funnel</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Status of pitches received across campaigns</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
              {totalApplications} Submissions
            </span>
          </div>

          {totalApplications === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No creator pitches received yet. As creators apply to your briefs, pitch conversion will appear here.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Accepted */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Accepted & Commissioned ({acceptedApplications})
                  </span>
                  <span className="text-neutral-600">
                    {totalApplications > 0
                      ? Math.round((acceptedApplications / totalApplications) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        totalApplications > 0
                          ? (acceptedApplications / totalApplications) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Pending Review */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Pending Brand Review ({pendingApplications})
                  </span>
                  <span className="text-neutral-600">
                    {totalApplications > 0
                      ? Math.round((pendingApplications / totalApplications) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        totalApplications > 0
                          ? (pendingApplications / totalApplications) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Declined / Other */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                    Declined or Archived ({rejectedApplications})
                  </span>
                  <span className="text-neutral-600">
                    {totalApplications > 0
                      ? Math.round((rejectedApplications / totalApplications) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-neutral-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        totalApplications > 0
                          ? (rejectedApplications / totalApplications) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Type / Domain Distribution */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Creative Formats</h3>
            <p className="text-xs text-neutral-500 mb-4">Brief breakdown by content modality</p>

            {Object.keys(domainCounts).length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs">
                No campaigns published yet.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {Object.entries(domainCounts).map(([fmt, count]) => (
                  <div key={fmt} className="flex justify-between items-center py-2 border-b border-neutral-100">
                    <span className="text-neutral-600 font-medium uppercase tracking-wider">{fmt}</span>
                    <span className="font-bold text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                      {count} {count === 1 ? 'brief' : 'briefs'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <span>✦</span> AI Matching Active across {briefs.length} campaigns
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Campaign Brief Performance</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Overview of budget allocation and pitch volume per brief</p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('briefs')}
              className="text-xs font-bold text-[#7952EC] hover:underline"
            >
              Manage All Briefs →
            </button>
          )}
        </div>

        {briefs.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            No campaign briefs created yet. Click "+ Create Brief" to launch your first generative brief.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                  <th className="py-3 px-3">CAMPAIGN BRIEF</th>
                  <th className="py-3 px-3">FORMAT</th>
                  <th className="py-3 px-3">BUDGET</th>
                  <th className="py-3 px-3">PITCHES</th>
                  <th className="py-3 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {briefs.slice(0, 6).map((b) => {
                  const briefApps = applications.filter((a) => a.brief_id === b.id);
                  return (
                    <tr key={b.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-neutral-900 max-w-xs truncate">
                        {b.title}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 uppercase font-medium">
                        {b.content_type || 'VIDEO'}
                      </td>
                      <td className="py-3 px-3 font-bold text-neutral-800">
                        {formatINR(b.budget_amount || 0)}
                      </td>
                      <td className="py-3 px-3 text-neutral-700 font-semibold">
                        {briefApps.length} {briefApps.length === 1 ? 'pitch' : 'pitches'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'ACTIVE' || b.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
