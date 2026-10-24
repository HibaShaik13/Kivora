import React from 'react';
import { formatINR, clampDemoBudget } from '../utils/indianLocalization';

export default function CreatorAnalyticsView({
  profile,
  applications = [],
  engagements = [],
  opportunities = [],
  onNavigate,
}) {
  // Calculations
  const completedEngagements = engagements.filter((e) => e.status === 'COMPLETED');
  const activeEngagements = engagements.filter(
    (e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED'
  );

  const totalEarned = completedEngagements.reduce(
    (sum, e) => sum + (parseFloat(e.agreed_amount) || 0),
    0
  );
  const activePipeline = activeEngagements.reduce(
    (sum, e) => sum + (parseFloat(e.agreed_amount) || 0),
    0
  );

  const totalPitches = applications.length;
  const acceptedPitches = applications.filter((a) => a.status === 'ACCEPTED').length;
  const pendingPitches = applications.filter((a) => a.status === 'PENDING').length;
  const rejectedPitches = applications.filter((a) => a.status === 'REJECTED').length;

  const acceptanceRate =
    totalPitches > 0 ? ((acceptedPitches / totalPitches) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="portal-header-row">
        <div>
          <span className="text-xs text-neutral-500 font-sans block mb-0.5">Performance & Insights</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
            Creator Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-sans">
            Track pitch conversion, earnings pipeline, and portfolio performance across all campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              type="button"
              className="portal-btn-primary"
              onClick={() => onNavigate('briefs')}
            >
              <span>Explore Briefs</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Pastel Stat Cards matching Kivora System */}
      <div className="portal-stat-grid">
        {/* 1. Total Earnings & Active Pipeline (Pastel Lavender) */}
        <div className="portal-stat-card lavender">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#F3E2FD', color: '#683EE6' }}>
              💰
            </div>
            <span className="portal-stat-title">Earnings & Pipeline</span>
          </div>
          <div>
            <div className="portal-stat-value">
              ${(totalEarned + activePipeline).toLocaleString()}
            </div>
            <div className="portal-stat-subtitle">
              ${totalEarned.toLocaleString()} settled • ${activePipeline.toLocaleString()} active
            </div>
          </div>
        </div>

        {/* 2. Pitch Conversion Rate (Pastel Mint) */}
        <div className="portal-stat-card mint">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#DBF7E9', color: '#059669' }}>
              🎯
            </div>
            <span className="portal-stat-title">Pitch Acceptance</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {acceptanceRate}%
            </div>
            <div className="portal-stat-subtitle">
              {acceptedPitches} accepted of {totalPitches} submitted
            </div>
          </div>
        </div>

        {/* 3. Reputation & Verification (Pastel Amber) */}
        <div className="portal-stat-card amber">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              ✨
            </div>
            <span className="portal-stat-title">Creator Credibility</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {profile?.average_rating ? `${profile.average_rating.toFixed(1)} ★` : '5.0 ★'}
            </div>
            <div className="portal-stat-subtitle">
              {profile?.verification_tier || 'COMMUNITY'} tier • {profile?.verified_claims_count || 0} verified claims
            </div>
          </div>
        </div>

        {/* 4. Demand & Matched Briefs (Pastel Sky) */}
        <div className="portal-stat-card sky">
          <div className="portal-stat-header">
            <div className="portal-stat-icon-wrap" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              ⚡
            </div>
            <span className="portal-stat-title">Opportunities & Reach</span>
          </div>
          <div>
            <div className="portal-stat-value">
              {opportunities?.length || 0}
            </div>
            <div className="portal-stat-subtitle">
              AI-matched briefs • {profile?.portfolio_projects?.length || 1} published works
            </div>
          </div>
        </div>
      </div>

      {/* Pitch Conversion Funnel & Specialization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Card (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Application Pitch Funnel</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Real-time breakdown of submitted proposals</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
              {totalPitches} Total Pitches
            </span>
          </div>

          {totalPitches === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No pitch applications submitted yet. Browse open briefs to submit your first proposal.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Accepted */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Accepted & Commissioned ({acceptedPitches})
                  </span>
                  <span className="text-neutral-600">
                    {totalPitches > 0 ? Math.round((acceptedPitches / totalPitches) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPitches > 0 ? (acceptedPitches / totalPitches) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Pending Review */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Under Review by Brands ({pendingPitches})
                  </span>
                  <span className="text-neutral-600">
                    {totalPitches > 0 ? Math.round((pendingPitches / totalPitches) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPitches > 0 ? (pendingPitches / totalPitches) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Rejected / Other */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                    Archived or Not Selected ({rejectedPitches})
                  </span>
                  <span className="text-neutral-600">
                    {totalPitches > 0 ? Math.round((rejectedPitches / totalPitches) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-neutral-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalPitches > 0 ? (rejectedPitches / totalPitches) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Attributes Card (1 col) */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Creative Profile Stats</h3>
            <p className="text-xs text-neutral-500 mb-4">Core domain attributes driving matching</p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-500">Specialization</span>
                <span className="font-bold text-neutral-800">{profile?.primary_specialization || 'Sci-Fi / Concept'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-500">Minimum Rate</span>
                <span className="font-bold text-neutral-800">{formatINR(clampDemoBudget(profile?.min_budget, 38000))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-500">Hourly Rate</span>
                <span className="font-bold text-neutral-800">{formatINR(profile?.hourly_rate || 1800)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-500">Experience</span>
                <span className="font-bold text-neutral-800">{profile?.years_experience || 6} Years</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span>●</span> Profile Visibility: Active Marketplace
            </span>
          </div>
        </div>
      </div>

      {/* Recent Campaign Applications Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Campaign Application Records</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Live status of pitches submitted to verified brand briefs</p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="text-xs font-bold text-[#7952EC] hover:underline"
            >
              View All Applications →
            </button>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            No application data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                  <th className="py-3 px-3">CAMPAIGN BRIEF</th>
                  <th className="py-3 px-3">PROPOSED RATE</th>
                  <th className="py-3 px-3">PITCH SUBMITTED</th>
                  <th className="py-3 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-900 max-w-xs truncate">
                      {app.brief?.title || app.brief_id || 'Campaign Brief'}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-800">
                      {app.proposed_rate ? formatINR(app.proposed_rate) : '—'}
                    </td>
                    <td className="py-3 px-3 text-neutral-500">
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {app.status === 'PENDING' ? 'UNDER REVIEW' : app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
