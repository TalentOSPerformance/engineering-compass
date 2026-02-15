import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';
import { MetricCard } from '@/components/charts/metric-card';
import { DORACards } from '@/components/dashboard/dora-cards';
import { FlowHealthCards } from '@/components/dashboard/flow-health-cards';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { MetricTrend } from '@/components/dashboard/metric-trend';

interface MemberStat {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  prs: number;
  reviews: number;
  commits: number;
}

interface TeamDetail {
  team: { id: string; name: string; parentTeamId: string | null };
  metrics: {
    flow: {
      cycleTimeP85: number;
      prPickupTimeAvg: number;
      silentPrRate: number;
      reviewDepthAvg: number;
    };
    dora: {
      deploymentFrequency: { value: number; unit: string; level: string; trendPct: number };
      leadTimeForChanges: { value: number; unit: string; level: string; trendPct: number };
      changeFailureRate: { value: number; unit: string; level: string; trendPct: number };
      timeToRestore: { value: number; unit: string; level: string; trendPct: number };
    };
  };
  members: MemberStat[];
  workBreakdown: {
    merged: number;
    open: number;
    closed: number;
  };
  recentActivity: {
    id: string;
    number: number;
    title: string;
    state: string;
    createdAt: string;
    mergedAt: string | null;
    author: { displayName: string } | null;
  }[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days } = useFilters();

  const [data, setData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !teamId) return;
    setLoading(true);
    api
      .get<TeamDetail>(`/metrics/${orgId}/team/${teamId}/detail?days=${days}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId, teamId, days]);

  if (!orgId || !teamId) {
    return <p className="text-muted">Selecione uma organizacao.</p>;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-surface-hover animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <MetricCard key={i} title="" value="" loading />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-red-400">Time nao encontrado ou sem dados.</p>;
  }

  const { team, metrics, members, workBreakdown, recentActivity } = data;
  const { flow, dora } = metrics;

  return (
    <div className="space-y-10">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-muted-foreground hover:text-foreground text-sm">← Home</a>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-lg font-bold text-blue-400">
            {team.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-sm text-muted-foreground">
              {members.length} membros — ultimos {days} dias
            </p>
          </div>
        </div>
      </div>

      {/* ─── Quick Summary Cards ───────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <MetricCard
            title="Cycle Time P85"
            value={Math.round(flow.cycleTimeP85)}
            unit="hrs"
            level={classifyCycleTime(flow.cycleTimeP85)}
          />
          <MetricCard
            title="PR Pickup Time"
            value={Math.round(flow.prPickupTimeAvg * 10) / 10}
            unit="hrs"
            level={classifyPickupTime(flow.prPickupTimeAvg)}
          />
          <MetricCard
            title="Deploy Frequency"
            value={Math.round(dora.deploymentFrequency.value * 100) / 100}
            unit="/day"
            level={dora.deploymentFrequency.level}
            trendPct={dora.deploymentFrequency.trendPct}
          />
          <MetricCard
            title="Silent PR Rate"
            value={`${Math.round(flow.silentPrRate * 100)}%`}
            level={classifySilentRate(flow.silentPrRate)}
          />
          <MetricCard
            title="Review Depth"
            value={Math.round(flow.reviewDepthAvg * 10) / 10}
            unit="comments/PR"
          />
        </div>
      </section>

      {/* ─── DORA (detalhado com icones + badges) ──────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">
          Delivery Performance (DORA)
        </h2>
        <DORACards metrics={dora as any} />
      </section>

      {/* ─── Flow Health (detalhado com progress bars) ─────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">
          Flow Health
        </h2>
        <FlowHealthCards flow={flow} />
      </section>

      {/* ─── Trends ────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">Trends</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MetricTrend
            title="Cycle Time (P85)"
            unit="hours"
            data={[
              { period: 'W1', value: Math.round(flow.cycleTimeP85 * 1.1) || 0 },
              { period: 'W2', value: Math.round(flow.cycleTimeP85 * 0.95) || 0 },
              { period: 'W3', value: Math.round(flow.cycleTimeP85 * 0.9) || 0 },
              { period: 'W4', value: Math.round(flow.cycleTimeP85) || 0 },
            ]}
            target={48}
          />
          <MetricTrend
            title="Deploy Frequency"
            unit="deploys/day"
            data={[
              { period: 'W1', value: Math.round(dora.deploymentFrequency.value * 0.9 * 100) / 100 },
              { period: 'W2', value: Math.round(dora.deploymentFrequency.value * 1.05 * 100) / 100 },
              { period: 'W3', value: Math.round(dora.deploymentFrequency.value * 1.1 * 100) / 100 },
              { period: 'W4', value: Math.round(dora.deploymentFrequency.value * 100) / 100 },
            ]}
            target={1}
          />
        </div>
      </section>

      {/* ─── Grid: Members + Work Breakdown ────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Members */}
        <div className="rounded-xl border border-border-default bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground-secondary">
            Membros ({members.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro adicionado.</p>
            ) : (
              members
                .sort((a, b) => (b.prs + b.commits) - (a.prs + a.commits))
                .map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-hover transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-300 flex-shrink-0">
                    {m.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.displayName}</p>
                    {m.email && <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <div className="text-center">
                      <p className="font-bold text-foreground-secondary text-sm">{m.prs}</p>
                      <p className="text-[10px]">PRs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground-secondary text-sm">{m.reviews}</p>
                      <p className="text-[10px]">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground-secondary text-sm">{m.commits}</p>
                      <p className="text-[10px]">Commits</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Work Breakdown */}
        <BarChartCard
          title="Work Breakdown"
          data={[
            { name: 'Merged', value: workBreakdown.merged },
            { name: 'Open', value: workBreakdown.open },
            { name: 'Closed', value: workBreakdown.closed },
          ]}
          dataKey="value"
          nameKey="name"
          colors={['#8b5cf6', '#10b981', '#6b7280']}
          height={280}
        />
      </div>

      {/* ─── Recent Activity ───────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">Atividade Recente</h2>
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
          {recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sem atividade recente.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">PR</th>
                  <th className="px-4 py-3">Autor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((pr) => (
                  <tr key={pr.id} className="border-b border-border-default last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="max-w-[300px] truncate">
                        <span className="text-muted-foreground">#{pr.number}</span>{' '}
                        <span className="font-medium text-foreground">{pr.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {pr.author?.displayName || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        pr.state === 'merged'
                          ? 'bg-purple-500/20 text-purple-400'
                          : pr.state === 'open'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          pr.state === 'merged' ? 'bg-purple-500' : pr.state === 'open' ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        {pr.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(pr.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function classifyCycleTime(hours: number): string {
  if (hours <= 24) return 'elite';
  if (hours <= 72) return 'high';
  if (hours <= 168) return 'medium';
  return 'low';
}

function classifyPickupTime(hours: number): string {
  if (hours <= 4) return 'elite';
  if (hours <= 12) return 'high';
  return 'low';
}

function classifySilentRate(rate: number): string {
  if (rate <= 0.1) return 'elite';
  if (rate <= 0.25) return 'high';
  return 'low';
}
