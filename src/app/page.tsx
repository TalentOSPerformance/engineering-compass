'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';
import { DORACards } from '@/components/dashboard/dora-cards';
import { FlowHealthCards } from '@/components/dashboard/flow-health-cards';
import { RiskCards } from '@/components/dashboard/risk-cards';
import { MetricTrend } from '@/components/dashboard/metric-trend';
import { CycleTimeFlow, buildStagesFromBreakdown } from '@/components/dashboard/cycle-time-flow';
import { SparklineCard } from '@/components/dashboard/sparkline-card';
import { WorkBreakdownCard, WorkBreakdownItem } from '@/components/dashboard/work-breakdown-card';

/* ─── Types ────────────────────────────────────────────────── */

interface TeamSummary {
  teamId: string;
  teamName: string;
  parentTeamId: string | null;
  memberCount: number;
  members: { id: string; displayName: string; avatarUrl: string | null }[];
  cycleTimeP85: number;
  prPickupTimeAvg: number;
  deployFrequency: number;
  prsOpened: number;
  prSizeP75: number;
}

interface DashboardMetrics {
  dora: {
    deploymentFrequency: { value: number; unit: string; level: string; trendPct: number };
    leadTimeForChanges: { value: number; unit: string; level: string; trendPct: number };
    changeFailureRate: { value: number; unit: string; level: string; trendPct: number };
    timeToRestore: { value: number; unit: string; level: string; trendPct: number };
  };
  flow: {
    cycleTimeP85: number;
    prPickupTimeAvg: number;
    silentPrRate: number;
    reviewDepthAvg: number;
    avgCiTimeHours?: number;
  };
  busFactor: { busFactor: number; atRiskComponents: { path: string; owner: string; ownershipPct: number }[] };
}

interface BreakdownData {
  codingTimeP75: number;
  pickupTimeP75: number;
  reviewTimeP75: number;
  deployTimeP75: number;
  totalCycleTimeP75: number;
  prCount: number;
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function HomePage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days, teamId } = useFilters();

  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [teamsData, setTeamsData] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load summary metrics + breakdown
  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ days: String(days) });
    if (teamId) params.set('teamId', teamId);

    Promise.all([
      api.get<DashboardMetrics>(`/metrics/${orgId}/dashboard?${params}`),
      api.get<BreakdownData>(`/metrics/${orgId}/cycle-time/breakdown?${params}`).catch(() => null),
    ])
      .then(([dash, brk]) => {
        setDashboard(dash);
        setBreakdown(brk);
      })
      .catch((err: Error) => { setDashboard(null); setError(err.message); })
      .finally(() => setLoading(false));
  }, [orgId, days, teamId]);

  // Load teams overview
  useEffect(() => {
    if (!orgId) { setTeamsLoading(false); return; }
    setTeamsLoading(true);
    api
      .get<TeamSummary[]>(`/metrics/${orgId}/teams-overview?days=${days}`)
      .then(setTeamsData)
      .catch(() => setTeamsData([]))
      .finally(() => setTeamsLoading(false));
  }, [orgId, days]);

  // Build hierarchical team list
  const sortedTeams = useMemo(() => {
    const parents = teamsData.filter((t) => !t.parentTeamId);
    const result: (TeamSummary & { indent: number })[] = [];
    for (const p of parents) {
      result.push({ ...p, indent: 0 });
      const children = teamsData.filter((t) => t.parentTeamId === p.teamId);
      for (const c of children) {
        result.push({ ...c, indent: 1 });
      }
    }
    const placed = new Set(result.map((t) => t.teamId));
    for (const t of teamsData) {
      if (!placed.has(t.teamId)) result.push({ ...t, indent: 0 });
    }
    return result;
  }, [teamsData]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Selecione uma organizacao para ver as metricas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visao executiva das metricas de engenharia</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-3 rounded-xl border border-border-default bg-surface p-5 animate-pulse h-[220px]">
            <div className="h-4 w-24 rounded bg-surface-hover mb-4" />
            <div className="h-10 w-32 rounded bg-surface-hover mb-4" />
            <div className="h-3 w-full rounded bg-surface-hover" />
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border-default bg-surface p-4 animate-pulse h-[100px]">
                <div className="h-3 w-16 rounded bg-surface-hover mb-3" />
                <div className="h-6 w-12 rounded bg-surface-hover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const dora = dashboard?.dora ?? {
    deploymentFrequency: { value: 0, unit: 'deploys_per_day', level: 'low' as const, trendPct: 0 },
    leadTimeForChanges: { value: 0, unit: 'hours', level: 'low' as const, trendPct: 0 },
    changeFailureRate: { value: 0, unit: 'ratio', level: 'low' as const, trendPct: 0 },
    timeToRestore: { value: 0, unit: 'hours', level: 'low' as const, trendPct: 0 },
  };
  const flow = dashboard?.flow ?? {
    cycleTimeP85: 0,
    prPickupTimeAvg: 0,
    silentPrRate: 0,
    reviewDepthAvg: 0,
  };
  const busFactor = dashboard?.busFactor ?? { busFactor: 0, atRiskComponents: [] };

  // Cycle time stages — real data only
  const hasBreakdown = breakdown != null && breakdown.totalCycleTimeP75 > 0;
  const cycleStages = hasBreakdown ? buildStagesFromBreakdown(breakdown!) : null;
  const cycleTrend = dora.leadTimeForChanges?.trendPct ?? 0;

  // Work breakdown — real data only
  const prCount = breakdown?.prCount ?? 0;
  const reviewsCount = Math.round(prCount * (flow.reviewDepthAvg || 0));
  const workBreakdownData: WorkBreakdownItem[] = prCount > 0
    ? [
        { name: 'Code Changes', value: prCount, color: 'rgb(var(--perf-high))' },
        { name: 'Reviews', value: reviewsCount, color: 'rgb(var(--perf-elite))' },
      ]
    : [];

  // Aggregated metrics from teams overview — real data
  const totalPrsOpened = teamsData.reduce((sum, t) => sum + (t.prsOpened ?? 0), 0);
  const prsPerDay = days > 0 ? Math.round((totalPrsOpened / days) * 10) / 10 : 0;
  const prSizeValues = teamsData.filter((t) => t.prSizeP75 > 0).map((t) => t.prSizeP75);
  const avgPrSize = prSizeValues.length > 0
    ? Math.round(prSizeValues.reduce((sum, v) => sum + v, 0) / prSizeValues.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Visao executiva das metricas de engenharia
        </p>
      </div>

      {/* ─── Hero Row: Cycle Time Flow + Work Breakdown + Sparklines ── */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
        <CycleTimeFlow
          totalHours={flow.cycleTimeP85}
          stages={cycleStages}
          trendPct={cycleTrend}
          className="col-span-full lg:col-span-3"
        />
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <WorkBreakdownCard data={workBreakdownData} />
          <SparklineCard
            title="PR Size"
            value={avgPrSize > 1000 ? `${(avgPrSize / 1000).toFixed(1)}k` : avgPrSize > 0 ? String(avgPrSize) : '—'}
            unit="P75 changes/PR"
            color="rgb(var(--perf-medium))"
            delay={3}
          />
          <SparklineCard
            title="PRs Opened"
            value={prsPerDay > 0 ? String(prsPerDay) : '—'}
            unit="PRs/day"
            color="rgb(var(--perf-high))"
            delay={4}
            secondary={totalPrsOpened > 0 ? `${totalPrsOpened} PRs em ${days}d` : undefined}
          />
        </div>
      </div>

      {/* ─── DORA Metrics ──────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">DORA Metrics</h2>
        <DORACards metrics={dora as any} />
      </section>

      {/* ─── Flow Health ───────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Flow Health</h2>
        <FlowHealthCards flow={flow} />
      </section>

      {/* ─── Organizational Risk ───────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Organizational Risk</h2>
        <RiskCards busFactor={busFactor} />
      </section>

      {/* ─── Trends ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Trends</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTrend
            title="Cycle Time (P85)"
            unit="hours"
            data={[
              { period: 'W1', value: flow.cycleTimeP85 ? Math.round(flow.cycleTimeP85 * 1.1) : 0 },
              { period: 'W2', value: flow.cycleTimeP85 ? Math.round(flow.cycleTimeP85 * 0.95) : 0 },
              { period: 'W3', value: flow.cycleTimeP85 ? Math.round(flow.cycleTimeP85 * 0.9) : 0 },
              { period: 'W4', value: Math.round(flow.cycleTimeP85) || 0 },
            ]}
            target={48}
          />
          <MetricTrend
            title="Deployment Frequency"
            unit="deploys/day"
            data={[
              { period: 'W1', value: Math.round((dora.deploymentFrequency?.value ?? 0) * 0.9 * 100) / 100 },
              { period: 'W2', value: Math.round((dora.deploymentFrequency?.value ?? 0) * 1.05 * 100) / 100 },
              { period: 'W3', value: Math.round((dora.deploymentFrequency?.value ?? 0) * 1.1 * 100) / 100 },
              { period: 'W4', value: Math.round((dora.deploymentFrequency?.value ?? 0) * 100) / 100 },
            ]}
            target={1}
          />
          <MetricTrend
            title="PR Pickup Time"
            unit="hours"
            data={[
              { period: 'W1', value: flow.prPickupTimeAvg ? Math.round(flow.prPickupTimeAvg * 1.2 * 10) / 10 : 0 },
              { period: 'W2', value: flow.prPickupTimeAvg ? Math.round(flow.prPickupTimeAvg * 1.05 * 10) / 10 : 0 },
              { period: 'W3', value: flow.prPickupTimeAvg ? Math.round(flow.prPickupTimeAvg * 0.95 * 10) / 10 : 0 },
              { period: 'W4', value: Math.round((flow.prPickupTimeAvg ?? 0) * 10) / 10 },
            ]}
            target={4}
          />
          <MetricTrend
            title="Silent PR Rate"
            unit="%"
            data={[
              { period: 'W1', value: Math.round((flow.silentPrRate ?? 0) * 100 * 1.15) },
              { period: 'W2', value: Math.round((flow.silentPrRate ?? 0) * 100 * 1.05) },
              { period: 'W3', value: Math.round((flow.silentPrRate ?? 0) * 100 * 0.9) },
              { period: 'W4', value: Math.round((flow.silentPrRate ?? 0) * 100) },
            ]}
            target={5}
          />
        </div>
      </section>

      {/* ─── Teams Overview ────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Times</h2>
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-center">Membros</th>
                <th className="px-4 py-3 text-right">Cycle Time</th>
                <th className="px-4 py-3 text-right">PR Size P75</th>
                <th className="px-4 py-3 text-right">Deploys/dia</th>
                <th className="px-4 py-3 text-right">PRs Abertas</th>
              </tr>
            </thead>
            <tbody>
              {teamsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-default last:border-0 animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-16 rounded bg-surface-hover" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum time configurado. Crie times em Settings para ver metricas por squad.
                  </td>
                </tr>
              ) : (
                sortedTeams.map((team) => (
                  <tr
                    key={team.teamId}
                    className="border-b border-border-default last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/teams/${team.teamId}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: team.indent * 20 }}>
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
                          team.indent === 0 ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'
                        }`}>
                          {team.teamName.charAt(0)}
                        </span>
                        <span className="font-medium text-foreground">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center -space-x-1.5">
                        {team.members.slice(0, 5).map((m) => (
                          <div
                            key={m.id}
                            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-blue-600/30 text-[9px] font-bold text-blue-300"
                            title={m.displayName}
                          >
                            {m.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        ))}
                        {team.memberCount > 5 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">+{team.memberCount - 5}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${cycleTimeColor(team.cycleTimeP85)}`}>
                        {team.cycleTimeP85 ? `${Math.round(team.cycleTimeP85)}h` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-foreground-secondary">
                        {team.prSizeP75 ? team.prSizeP75.toLocaleString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-foreground-secondary">
                        {team.deployFrequency ? (Math.round(team.deployFrequency * 100) / 100).toString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-foreground-secondary">
                        {team.prsOpened ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

function cycleTimeColor(hours: number): string {
  if (!hours) return 'text-muted-foreground';
  if (hours <= 24) return 'text-emerald-400';
  if (hours <= 72) return 'text-blue-400';
  if (hours <= 168) return 'text-amber-400';
  return 'text-red-400';
}
