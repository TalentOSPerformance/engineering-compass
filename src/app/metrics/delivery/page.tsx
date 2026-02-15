import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';
import { MetricCard } from '@/components/charts/metric-card';
import { DORACards } from '@/components/dashboard/dora-cards';
import { FlowHealthCards } from '@/components/dashboard/flow-health-cards';
import { ScatterChartCard } from '@/components/charts/scatter-chart-card';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { MetricTrend } from '@/components/dashboard/metric-trend';
import { DORABenchmarks } from '@/components/delivery/dora-benchmarks';

type Tab = 'overview' | 'scatter' | 'prs' | 'dora' | 'quality' | 'throughput' | 'dora-plus' | 'bugs' | 'control-chart' | 'forecast';

interface ProcessLimitsData {
  mean: number;
  stdDev: number;
  ucl: number;
  lcl: number;
  metric: string;
  dataPoints: Array<{ week: string; value: number; isOutlier: boolean }>;
}

interface ForecastData {
  targetItems: number;
  simulations: number;
  percentiles: { p50: number; p85: number; p95: number };
  histogram: Array<{ weeks: number; frequency: number }>;
  weeksOfHistory: number;
}

interface BreakdownData {
  codingTimeP75: number;
  pickupTimeP75: number;
  reviewTimeP75: number;
  deployTimeP75: number;
  totalCycleTimeP75: number;
  prCount: number;
}

interface ScatterPoint {
  id: string;
  title: string;
  size: number;
  cycleTimeHours: number;
  sizeCategory: string;
}

interface PRItem {
  id: string;
  number: number;
  title: string;
  state: string;
  createdAt: string;
  mergedAt: string | null;
  cycleTimeHours: number | null;
  additions: number;
  deletions: number;
  sizeCategory: string;
  source: string;
  riskScore?: number | null;
}

interface DORAData {
  current: {
    deploymentFrequency: { value: number; unit: string; level: string; trendPct: number };
    leadTimeForChanges: { value: number; unit: string; level: string; trendPct: number };
    changeFailureRate: { value: number; unit: string; level: string; trendPct: number };
    timeToRestore: { value: number; unit: string; level: string; trendPct: number };
  };
  trends: Record<string, number>;
}

interface DashboardData {
  flow: {
    cycleTimeP85: number;
    prPickupTimeAvg: number;
    silentPrRate: number;
    reviewDepthAvg: number;
  };
}

interface ReviewDistribution {
  silent: number;
  oneReviewer: number;
  twoPlus: number;
  total: number;
}

interface QualityTimelineDay {
  date: string;
  label: string;
  prsMergedWithoutReview: number;
  prSizeP75: number;
  reviewDepthAvg: number;
  newCodePct: number;
  refactorPct: number;
  reworkRate: number;
  prMaturityAvg: number;
  ciPassRate: number;
}

interface QualityData {
  reworkRate: number;
  ciPassRate: number;
  silentPrRate: number;
  reviewDepthAvg: number;
  prsMergedWithoutReviewCount?: number;
  prsMergedWithoutReviewPerDay?: number;
  prSizeP75?: number;
  newCodePct?: number;
  refactorPct?: number;
  prMaturityAvg?: number;
  timelineDaily?: QualityTimelineDay[];
}

interface ThroughputTimelineWeek {
  weekStart: string;
  weekLabel: string;
  codeChanges: number;
  commits: number;
  prsOpened: number;
  prsMerged: number;
  reviews: number;
  deploys: number;
  prsReviewed: number;
}

interface ThroughputTimelineDay {
  date: string;
  label: string;
  codeChanges: number;
  commits: number;
  prsOpened: number;
  prsMerged: number;
  reviews: number;
  deploys: number;
  prsReviewed: number;
}

interface ThroughputData {
  codeChanges: number;
  codeChangesPerDay?: number;
  commitsTotal: number;
  commitsPerDay?: number;
  prsOpened: number;
  prsOpenedPerDay?: number;
  mergeFrequency: number;
  mergeFrequencyUnit?: string;
  reviewsCount: number;
  reviewsPerDay?: number;
  deployFrequency: number;
  deployFrequencyUnit?: string;
  prsReviewed: number;
  prsReviewedPerDay?: number;
  prsMerged: number;
  prsPerWeek: { weekStart: string; count: number }[];
  commitsPerPrAvg: number;
  storyPointsResolved: number;
  deploysTotal: number;
  timeline?: ThroughputTimelineWeek[];
  timelineDaily?: ThroughputTimelineDay[];
}

interface DoraPlusData {
  mttrByEnvironment: Record<string, number>;
  recoveryCount: Record<string, number>;
}

interface BugsData {
  bugsOpen: number;
  bugsResolved: number;
  mttrBugsHoursMedian: number;
  bugs: Array<{
    id: string;
    issueKey: string;
    summary: string;
    status: string;
    resolvedAt: string | null;
    leadTimeHours: number | null;
  }>;
}

const CHART_COLOR = '#6366f1';

/** Card with title, value and area chart (same layout as Throughput). */
function MetricCardWithChart({
  title,
  value,
  formatValue,
  suffix,
  data,
  dataKey,
  loading,
  tooltip,
}: {
  title: string;
  value: number;
  formatValue: (v: number) => string;
  suffix: string;
  data: Array<{ label: string; [key: string]: unknown }>;
  dataKey: string;
  loading: boolean;
  tooltip?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-4 animate-pulse">
        <div className="h-4 w-28 rounded bg-surface-hover" />
        <div className="mt-2 h-8 w-20 rounded bg-surface-hover" />
        <div className="mt-4 h-[120px] rounded bg-surface-hover" />
      </div>
    );
  }
  const displayValue = formatValue(value);
  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-foreground-secondary">{title}</p>
        {tooltip && (
          <span className="cursor-help text-muted-foreground hover:text-foreground" title={tooltip} aria-label={tooltip}>
            <span className="text-[10px] leading-none">ⓘ</span>
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {displayValue} <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
      </p>
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={120} className="mt-3">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id={`grad-metric-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.25} />
                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default, #e5e7eb)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-border-default bg-surface px-2 py-1.5 shadow-lg text-xs">
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-foreground-secondary">{payload[0].value}</p>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={CHART_COLOR}
              strokeWidth={2}
              fill={`url(#grad-metric-${dataKey})`}
              dot={{ r: 2, fill: CHART_COLOR }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ThroughputMetricCard({
  title,
  valuePerDay,
  data,
  dataKey,
  formatValue,
  loading,
  suffix = 'per day',
}: {
  title: string;
  valuePerDay: number;
  data: ThroughputTimelineDay[];
  dataKey: keyof ThroughputTimelineDay;
  formatValue: (v: number) => string;
  loading: boolean;
  suffix?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-4 animate-pulse">
        <div className="h-4 w-28 rounded bg-surface-hover" />
        <div className="mt-2 h-8 w-20 rounded bg-surface-hover" />
        <div className="mt-4 h-[120px] rounded bg-surface-hover" />
      </div>
    );
  }
  const displayValue = formatValue(valuePerDay);
  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <p className="text-sm font-medium text-foreground-secondary">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
        {displayValue} <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
      </p>
      <ResponsiveContainer width="100%" height={120} className="mt-3">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`grad-throughput-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default, #e5e7eb)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-border-default bg-surface px-2 py-1.5 shadow-lg text-xs">
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-foreground-secondary">{payload[0].value}</p>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLOR}
            strokeWidth={2}
            fill={`url(#grad-throughput-${dataKey})`}
            dot={{ r: 2, fill: CHART_COLOR }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DeliveryPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days, teamId } = useFilters();

  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [scatter, setScatter] = useState<ScatterPoint[]>([]);
  const [prs, setPrs] = useState<PRItem[]>([]);
  const [doraData, setDoraData] = useState<DORAData | null>(null);
  const [flowData, setFlowData] = useState<DashboardData['flow'] | null>(null);
  const [reviewDist, setReviewDist] = useState<ReviewDistribution | null>(null);
  const [qualityData, setQualityData] = useState<QualityData | null>(null);
  const [throughputData, setThroughputData] = useState<ThroughputData | null>(null);
  const [doraPlusData, setDoraPlusData] = useState<DoraPlusData | null>(null);
  const [bugsData, setBugsData] = useState<BugsData | null>(null);
  const [processLimits, setProcessLimits] = useState<ProcessLimitsData | null>(null);
  const [controlMetric, setControlMetric] = useState<'cycle_time' | 'throughput_weekly'>('cycle_time');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [forecastTarget, setForecastTarget] = useState(20);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (teamId) params.set('teamId', teamId);

    Promise.all([
      api.get<BreakdownData>(`/metrics/${orgId}/cycle-time/breakdown?${params}`),
      api.get<ScatterPoint[]>(`/metrics/${orgId}/cycle-time/scatter?${params}`),
      api.get<PRItem[]>(`/metrics/${orgId}/flow/pull-requests?days=${days}`),
      api.get<DORAData>(`/metrics/${orgId}/dora?${params}`),
      api.get<DashboardData>(`/metrics/${orgId}/dashboard?${params}`).catch(() => null),
      api.get<ReviewDistribution>(`/metrics/${orgId}/flow/review-distribution?days=${days}`).catch(() => null),
      api.get<QualityData>(`/metrics/${orgId}/quality?${params}`).catch(() => null),
      api.get<ThroughputData>(`/metrics/${orgId}/throughput?${params}`).catch(() => null),
      api.get<DoraPlusData>(`/metrics/${orgId}/dora-plus?${params}`).catch(() => null),
      api.get<BugsData>(`/metrics/${orgId}/bugs?${params}`).catch(() => null),
      api.get<ProcessLimitsData>(`/metrics/${orgId}/process-limits?${params}&metric=cycle_time`).catch(() => null),
    ])
      .then(([bd, sc, pr, dora, dash, revDist, quality, throughput, doraPlus, bugs, pl]) => {
        setBreakdown(bd);
        setScatter(sc);
        setPrs(pr);
        setDoraData(dora);
        if (dash) setFlowData((dash as any).flow ?? null);
        if (revDist) setReviewDist(revDist as any);
        if (quality) setQualityData(quality);
        if (throughput) setThroughputData(throughput);
        if (doraPlus) setDoraPlusData(doraPlus);
        if (bugs) setBugsData(bugs);
        if (pl) setProcessLimits(pl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId, days, teamId]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Delivery Metrics</h1>
        <p className="text-muted">Selecione uma organizacao.</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'scatter', label: 'Scatter Plot' },
    { key: 'prs', label: 'Pull Requests' },
    { key: 'dora', label: 'DORA' },
    { key: 'quality', label: 'Quality' },
    { key: 'throughput', label: 'Throughput' },
    { key: 'dora-plus', label: 'DORA+' },
    { key: 'bugs', label: 'Bugs' },
    { key: 'control-chart', label: 'Control Chart' },
    { key: 'forecast', label: 'Forecast' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delivery Metrics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cycle Time breakdown, DORA e Flow — ultimos {days} dias
        </p>
      </div>

      {/* ─── Cycle Time Breakdown Cards ────────────────────────── */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-foreground-secondary">Cycle Time Breakdown</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            title="Cycle Time P75"
            value={breakdown ? Math.round(breakdown.totalCycleTimeP75) : '—'}
            unit="hrs"
            level={classifyCycleTime(breakdown?.totalCycleTimeP75)}
            loading={loading}
          />
          <MetricCard
            title="Coding Time"
            value={breakdown ? Math.round(breakdown.codingTimeP75) : '—'}
            unit="hrs"
            loading={loading}
          />
          <MetricCard
            title="Pickup Time"
            value={breakdown ? Math.round(breakdown.pickupTimeP75 * 10) / 10 : '—'}
            unit="hrs"
            loading={loading}
          />
          <MetricCard
            title="Review Time"
            value={breakdown ? Math.round(breakdown.reviewTimeP75 * 10) / 10 : '—'}
            unit="hrs"
            loading={loading}
          />
          <MetricCard
            title="Deploy Time"
            value={breakdown ? Math.round(breakdown.deployTimeP75 * 10) / 10 : '—'}
            unit="hrs"
            loading={loading}
          />
          <MetricCard
            title="PRs Merged"
            value={breakdown?.prCount ?? '—'}
            loading={loading}
          />
        </div>
      </section>

      {/* ─── Flow Health (detalhado com progress bars) ─────────── */}
      {flowData && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground-secondary">Flow Health</h2>
          <FlowHealthCards flow={flowData} />
        </section>
      )}

      {/* ─── Review Distribution ───────────────────────────────── */}
      {reviewDist && reviewDist.total > 0 && (
        <section>
          <BarChartCard
            title="Review Distribution"
            description="Quantidade de PRs mergeados no período por número de revisores (0, 1 ou 2+)."
            tooltip="Mostra quantos PRs foram mergeados sem review (vermelho), com 1 revisor (laranja) ou com 2+ revisores (verde). Ajuda a ver se o time está praticando code review: muitos PRs em vermelho indicam merges sem aprovação de outro dev, o que pode aumentar risco de bugs."
            data={[
              { name: 'Silent (0 reviews)', value: reviewDist.silent },
              { name: '1 Reviewer', value: reviewDist.oneReviewer },
              { name: '2+ Reviewers', value: reviewDist.twoPlus },
            ]}
            dataKey="value"
            nameKey="name"
            colors={['#ef4444', '#f59e0b', '#10b981']}
            height={180}
          />
        </section>
      )}

      {/* ─── Tabs ──────────────────────────────────────────────── */}
      <div>
        <div className="flex gap-1 border-b border-border-default">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* ── Overview tab ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Trend charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MetricTrend
                  title="Cycle Time (P75)"
                  unit="hours"
                  data={[
                    { period: 'W1', value: breakdown ? Math.round(breakdown.totalCycleTimeP75 * 1.1) : 0 },
                    { period: 'W2', value: breakdown ? Math.round(breakdown.totalCycleTimeP75 * 0.95) : 0 },
                    { period: 'W3', value: breakdown ? Math.round(breakdown.totalCycleTimeP75 * 0.9) : 0 },
                    { period: 'W4', value: breakdown ? Math.round(breakdown.totalCycleTimeP75) : 0 },
                  ]}
                  target={48}
                />
                <MetricTrend
                  title="Deployment Frequency"
                  unit="deploys/day"
                  data={[
                    { period: 'W1', value: doraData ? Math.round(doraData.current.deploymentFrequency.value * 0.9 * 100) / 100 : 0 },
                    { period: 'W2', value: doraData ? Math.round(doraData.current.deploymentFrequency.value * 1.05 * 100) / 100 : 0 },
                    { period: 'W3', value: doraData ? Math.round(doraData.current.deploymentFrequency.value * 1.1 * 100) / 100 : 0 },
                    { period: 'W4', value: doraData ? Math.round(doraData.current.deploymentFrequency.value * 100) / 100 : 0 },
                  ]}
                  target={1}
                />
              </div>

              {/* Scatter + stacked breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ScatterChartCard
                  title="Cycle Time vs PR Size"
                  data={scatter.map((p) => ({
                    size: (p as any).sizeLines ?? p.size ?? 0,
                    cycleTimeHours: p.cycleTimeHours,
                    title: p.title,
                  }))}
                  xKey="size"
                  yKey="cycleTimeHours"
                  xLabel="Lines changed"
                  yLabel="Cycle Time (hours)"
                  height={280}
                  loading={loading}
                />
                {breakdown && (
                  <BarChartCard
                    title="Cycle Time Breakdown (P75)"
                    data={[
                      { name: 'Coding', value: breakdown.codingTimeP75 },
                      { name: 'Pickup', value: breakdown.pickupTimeP75 },
                      { name: 'Review', value: breakdown.reviewTimeP75 },
                      { name: 'Deploy', value: breakdown.deployTimeP75 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    unit="hrs"
                    colors={['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981']}
                    height={280}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Scatter tab ──────────────────────────────────── */}
          {activeTab === 'scatter' && (
            <ScatterChartCard
              title="Cycle Time vs PR Size"
              data={scatter.map((p) => ({
                size: (p as any).sizeLines ?? p.size ?? 0,
                cycleTimeHours: p.cycleTimeHours,
                title: p.title,
              }))}
              xKey="size"
              yKey="cycleTimeHours"
              xLabel="Lines changed"
              yLabel="Cycle Time (hours)"
              height={400}
              loading={loading}
            />
          )}

          {/* ── PRs tab ──────────────────────────────────────── */}
          {activeTab === 'prs' && (
            <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">PR</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Size Cat.</th>
                    <th className="px-4 py-3 text-right">Changes</th>
                    <th className="px-4 py-3 text-right">Cycle Time</th>
                    <th className="px-4 py-3 text-right">Risk</th>
                    <th className="px-4 py-3 text-right">Created</th>
                    <th className="px-4 py-3 text-right">Merged</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border-default animate-pulse">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 w-20 rounded bg-surface-hover" /></td>
                        ))}
                      </tr>
                    ))
                  ) : prs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum PR encontrado.</td>
                    </tr>
                  ) : (
                    prs.slice(0, 100).map((pr) => (
                      <tr key={pr.id} className="border-b border-border-default last:border-0 hover:bg-surface-hover">
                        <td className="px-4 py-3">
                          <div className="max-w-[280px] truncate font-medium text-foreground">
                            <span className="mr-1.5 text-muted-foreground">#{pr.number}</span>
                            {pr.title}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            pr.state === 'merged'
                              ? 'bg-purple-500/20 text-purple-400'
                              : pr.state === 'open'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {pr.state}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${sizeCatStyle(pr.sizeCategory)}`}>
                            {pr.sizeCategory || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-emerald-400">+{pr.additions}</span>
                          <span className="mx-0.5 text-muted-foreground">/</span>
                          <span className="text-xs text-red-400">-{pr.deletions}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {pr.cycleTimeHours ? `${Math.round(pr.cycleTimeHours)}h` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {pr.riskScore != null ? (
                            <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              pr.riskScore >= 67 ? 'bg-red-500/20 text-red-400' :
                              pr.riskScore >= 34 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {Math.round(pr.riskScore)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {new Date(pr.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {pr.mergedAt ? new Date(pr.mergedAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DORA Detail tab ──────────────────────────────── */}
          {activeTab === 'dora' && doraData && (
            <div className="space-y-6">
              <DORACards metrics={doraData.current as any} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MetricTrend
                  title="Lead Time for Changes"
                  unit="hours"
                  data={[
                    { period: 'W1', value: Math.round(doraData.current.leadTimeForChanges.value * 1.15) },
                    { period: 'W2', value: Math.round(doraData.current.leadTimeForChanges.value * 1.05) },
                    { period: 'W3', value: Math.round(doraData.current.leadTimeForChanges.value * 0.92) },
                    { period: 'W4', value: Math.round(doraData.current.leadTimeForChanges.value) },
                  ]}
                  target={24}
                />
                <MetricTrend
                  title="Change Failure Rate"
                  unit="%"
                  data={[
                    { period: 'W1', value: Math.round(doraData.current.changeFailureRate.value * 100 * 1.2) },
                    { period: 'W2', value: Math.round(doraData.current.changeFailureRate.value * 100 * 1.05) },
                    { period: 'W3', value: Math.round(doraData.current.changeFailureRate.value * 100 * 0.9) },
                    { period: 'W4', value: Math.round(doraData.current.changeFailureRate.value * 100) },
                  ]}
                  target={5}
                />
              </div>
              <DORABenchmarks current={doraData.current} />
            </div>
          )}

          {/* ── Quality tab (mesmo estilo que Throughput: card + valor + gráfico diário) ─── */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground-secondary">Quality</h2>
              {qualityData?.timelineDaily && qualityData.timelineDaily.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <MetricCardWithChart
                    title="PRs merged w/o review"
                    value={qualityData.prsMergedWithoutReviewPerDay ?? qualityData.prsMergedWithoutReviewCount ?? 0}
                    formatValue={(v) => String(v)}
                    suffix="PRs/day"
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="prsMergedWithoutReview"
                    loading={loading}
                  />
                  <MetricCardWithChart
                    title="PR Size"
                    value={qualityData.prSizeP75 ?? 0}
                    formatValue={(v) => String(Math.round(v))}
                    suffix="75th % (lines/PR)"
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="prSizeP75"
                    loading={loading}
                  />
                  <MetricCardWithChart
                    title="Review Depth"
                    value={qualityData.reviewDepthAvg ?? 0}
                    formatValue={(v) => v.toFixed(1)}
                    suffix="Comments per review"
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="reviewDepthAvg"
                    loading={loading}
                    tooltip="Total number of comments by reviewers on each PR (merged PRs only)."
                  />
                  <MetricCardWithChart
                    title="New code"
                    value={(qualityData.newCodePct ?? 0) * 100}
                    formatValue={(v) => `${Math.round(v)}%`}
                    suffix=""
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="newCodePct"
                    loading={loading}
                    tooltip="Work breakdown: % of merged PRs where additions exceed deletions (new development)."
                  />
                  <MetricCardWithChart
                    title="Refactor"
                    value={(qualityData.refactorPct ?? 0) * 100}
                    formatValue={(v) => `${Math.round(v)}%`}
                    suffix="Refactor code"
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="refactorPct"
                    loading={loading}
                    tooltip="Work breakdown: % of merged PRs with similar add/delete volume (revisions to existing code)."
                  />
                  <MetricCardWithChart
                    title="Rework"
                    value={(qualityData.reworkRate ?? 0) * 100}
                    formatValue={(v) => `${Math.round(v)}%`}
                    suffix=""
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="reworkRate"
                    loading={loading}
                    tooltip="% of merged PRs that had at least one CHANGES_REQUESTED before approval."
                  />
                  <MetricCardWithChart
                    title="PR Maturity"
                    value={(qualityData.prMaturityAvg ?? 0) * 100}
                    formatValue={(v) => `${Math.round(v)}%`}
                    suffix="Avg maturity ratio"
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="prMaturityAvg"
                    loading={loading}
                    tooltip="How refined the PR was when submitted for review: (changes before first review) / (total changes). Higher = less churn after first review."
                  />
                  <MetricCardWithChart
                    title="CI pass rate"
                    value={(qualityData.ciPassRate ?? 0) * 100}
                    formatValue={(v) => `${Math.round(v)}%`}
                    suffix=""
                    data={qualityData.timelineDaily as unknown as Array<{ label: string; [key: string]: unknown }>}
                    dataKey="ciPassRate"
                    loading={loading}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <MetricCard title="PRs merged w/o review" value={qualityData?.prsMergedWithoutReviewPerDay ?? qualityData?.prsMergedWithoutReviewCount ?? '—'} unit="PRs/day" loading={loading} />
                  <MetricCard title="PR Size" value={qualityData?.prSizeP75 ?? '—'} unit="P75 lines" loading={loading} />
                  <MetricCard title="Review Depth" value={qualityData?.reviewDepthAvg ?? '—'} unit="comments/PR" loading={loading} />
                  <MetricCard title="New code" value={qualityData?.newCodePct != null ? `${Math.round(qualityData.newCodePct * 100)}%` : '—'} loading={loading} />
                  <MetricCard title="Refactor" value={qualityData?.refactorPct != null ? `${Math.round(qualityData.refactorPct * 100)}%` : '—'} loading={loading} />
                  <MetricCard title="Rework" value={qualityData != null ? `${Math.round(qualityData.reworkRate * 100)}%` : '—'} loading={loading} />
                  <MetricCard title="PR Maturity" value={qualityData?.prMaturityAvg != null ? `${Math.round(qualityData.prMaturityAvg * 100)}%` : '—'} loading={loading} />
                  <MetricCard title="CI pass rate" value={qualityData != null ? `${Math.round(qualityData.ciPassRate * 100)}%` : '—'} loading={loading} />
                </div>
              )}
              {!loading && !qualityData && (
                <p className="text-sm text-muted-foreground">Sem dados de Quality no período.</p>
              )}
            </div>
          )}

          {/* ── Throughput tab ──────────────────────────────── */}
          {activeTab === 'throughput' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground-secondary">Throughput</h2>

              {/* Cards com valor por dia + gráfico de evolução diária (estilo timeline) */}
              {throughputData?.timelineDaily && throughputData.timelineDaily.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <ThroughputMetricCard
                    title="Code Changes"
                    valuePerDay={throughputData.codeChangesPerDay ?? throughputData.codeChanges / Math.max(1, days)}
                    data={throughputData.timelineDaily}
                    dataKey="codeChanges"
                    formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                    loading={loading}
                  />
                  <ThroughputMetricCard
                    title="Commits"
                    valuePerDay={throughputData.commitsPerDay ?? throughputData.commitsTotal / Math.max(1, days)}
                    data={throughputData.timelineDaily}
                    dataKey="commits"
                    formatValue={(v) => String(Math.round(v))}
                    loading={loading}
                  />
                  <ThroughputMetricCard
                    title="PRs Opened"
                    valuePerDay={throughputData.prsOpenedPerDay ?? throughputData.prsOpened / Math.max(1, days)}
                    data={throughputData.timelineDaily}
                    dataKey="prsOpened"
                    formatValue={(v) => String(v)}
                    loading={loading}
                  />
                  <ThroughputMetricCard
                    title="Merge Frequency"
                    valuePerDay={throughputData.mergeFrequency}
                    data={throughputData.timelineDaily}
                    dataKey="prsMerged"
                    formatValue={(v) => String(v)}
                    loading={loading}
                    suffix="PRs/day"
                  />
                  <ThroughputMetricCard
                    title="Reviews"
                    valuePerDay={throughputData.reviewsPerDay ?? throughputData.reviewsCount / Math.max(1, days)}
                    data={throughputData.timelineDaily}
                    dataKey="reviews"
                    formatValue={(v) => String(Math.round(v))}
                    loading={loading}
                  />
                  <ThroughputMetricCard
                    title="Deploy Frequency"
                    valuePerDay={throughputData.deployFrequency}
                    data={throughputData.timelineDaily}
                    dataKey="deploys"
                    formatValue={(v) => String(v)}
                    loading={loading}
                    suffix="/day"
                  />
                  <ThroughputMetricCard
                    title="PRs Reviewed"
                    valuePerDay={throughputData.prsReviewedPerDay ?? throughputData.prsReviewed / Math.max(1, days)}
                    data={throughputData.timelineDaily}
                    dataKey="prsReviewed"
                    formatValue={(v) => String(Math.round(v))}
                    loading={loading}
                  />
                </div>
              )}

              {/* Resumo e demais métricas */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <MetricCard title="Story points" value={loading ? '—' : throughputData?.storyPointsResolved ?? '—'} loading={loading} />
                <MetricCard title="Commits/PR (avg)" value={loading ? '—' : throughputData?.commitsPerPrAvg ?? '—'} loading={loading} />
                <MetricCard title="Deploys (total)" value={loading ? '—' : throughputData?.deploysTotal ?? '—'} loading={loading} />
              </div>
              {throughputData && throughputData.prsPerWeek.length > 0 && (
                <BarChartCard
                  title="PRs merged por semana"
                  data={throughputData.prsPerWeek.map((w) => ({ name: w.weekStart, value: w.count }))}
                  dataKey="value"
                  nameKey="name"
                  height={220}
                />
              )}
              {throughputData && (!throughputData.timelineDaily || throughputData.timelineDaily.length === 0) && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
                  <MetricCard title="Code changes" value={throughputData.codeChanges} loading={false} />
                  <MetricCard title="Commits" value={throughputData.commitsTotal} loading={false} />
                  <MetricCard title="PRs opened" value={throughputData.prsOpened} loading={false} />
                  <MetricCard title="Merge Frequency" value={`${throughputData.mergeFrequency}/day`} loading={false} />
                  <MetricCard title="Reviews" value={throughputData.reviewsCount} loading={false} />
                  <MetricCard title="Deploy frequency" value={`${throughputData.deployFrequency}/day`} loading={false} />
                  <MetricCard title="PRs reviewed" value={throughputData.prsReviewed} loading={false} />
                </div>
              )}
              {!loading && !throughputData && (
                <p className="text-sm text-muted-foreground">Sem dados de Throughput no período.</p>
              )}
            </div>
          )}

          {/* ── DORA+ tab ──────────────────────────────── */}
          {activeTab === 'dora-plus' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground-secondary">DORA+</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {doraPlusData && Object.entries(doraPlusData.mttrByEnvironment).map(([env, hours]) => (
                  <MetricCard key={env} title={`MTTR (${env})`} value={hours} unit="hrs" loading={loading} />
                ))}
                {doraPlusData && Object.entries(doraPlusData.recoveryCount).map(([env, count]) => (
                  <MetricCard key={`rc-${env}`} title={`Recovery count (${env})`} value={count} loading={loading} />
                ))}
              </div>
              {!loading && (!doraPlusData || (Object.keys(doraPlusData?.mttrByEnvironment ?? {}).length === 0 && Object.keys(doraPlusData?.recoveryCount ?? {}).length === 0)) && (
                <p className="text-sm text-muted-foreground">Sem dados DORA+ no período.</p>
              )}
            </div>
          )}

          {/* ── Control Chart tab ──────────────────────────── */}
          {activeTab === 'control-chart' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground-secondary">Natural Process Limits (UCL/LCL)</h2>
                <select
                  value={controlMetric}
                  onChange={async (e) => {
                    const m = e.target.value as 'cycle_time' | 'throughput_weekly';
                    setControlMetric(m);
                    if (!orgId) return;
                    const params2 = new URLSearchParams({ days: String(days), metric: m });
                    if (teamId) params2.set('teamId', teamId);
                    try {
                      const r = await api.get<ProcessLimitsData>(`/metrics/${orgId}/process-limits?${params2}`);
                      setProcessLimits(r);
                    } catch { /* ignore */ }
                  }}
                  className="rounded border border-border-default bg-surface px-3 py-1.5 text-sm"
                >
                  <option value="cycle_time">Cycle Time (hrs)</option>
                  <option value="throughput_weekly">Throughput (PRs/week)</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground">
                Limites de controle estatísticos (média ± 2σ). Pontos fora do UCL/LCL indicam instabilidade real no processo.
              </p>

              {processLimits && processLimits.dataPoints.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-6">
                    <div><span className="text-2xl font-bold">{processLimits.mean}</span><p className="text-xs text-muted-foreground">Média</p></div>
                    <div><span className="text-2xl font-bold">{processLimits.ucl}</span><p className="text-xs text-muted-foreground">UCL</p></div>
                    <div><span className="text-2xl font-bold">{processLimits.lcl}</span><p className="text-xs text-muted-foreground">LCL</p></div>
                    <div><span className="text-2xl font-bold">{processLimits.stdDev}</span><p className="text-xs text-muted-foreground">Std Dev</p></div>
                    <div>
                      <span className="text-2xl font-bold text-red-500">{processLimits.dataPoints.filter((p) => p.isOutlier).length}</span>
                      <p className="text-xs text-muted-foreground">Outliers</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={processLimits.dataPoints} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default, #e5e7eb)" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border border-border-default bg-surface px-2 py-1.5 shadow-lg text-xs">
                              <p className="font-medium">{label}</p>
                              <p>{payload[0].value} {controlMetric === 'cycle_time' ? 'hrs' : 'PRs'}</p>
                              {(payload[0].payload as ProcessLimitsData['dataPoints'][0]).isOutlier && (
                                <p className="text-red-500 font-medium">OUTLIER</p>
                              )}
                            </div>
                          ) : null
                        } />
                        {/* UCL/LCL reference lines */}
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#grad-control)" dot={(props: Record<string, unknown>) => {
                          const pt = props.payload as ProcessLimitsData['dataPoints'][0];
                          const cx = props.cx as number;
                          const cy = props.cy as number;
                          return <circle key={pt.week} cx={cx} cy={cy} r={pt.isOutlier ? 5 : 3} fill={pt.isOutlier ? '#ef4444' : '#6366f1'} />;
                        }} />
                        <defs>
                          <linearGradient id="grad-control" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>— Linha azul: valor semanal</span>
                    <span className="text-red-500">● Pontos vermelhos: outliers (fora UCL/LCL)</span>
                    <span>UCL = {processLimits.ucl} | LCL = {processLimits.lcl}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Sem dados suficientes para calcular limites de processo.</p>
              )}
            </div>
          )}

          {/* ── Forecast tab ──────────────────────────────── */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground-secondary">Monte Carlo Forecast</h2>
              <p className="text-sm text-muted-foreground">
                Simulação baseada no throughput histórico (últimos 90 dias) para prever quando N itens serão entregues.
              </p>

              <div className="flex items-end gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Quantos itens entregar?</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={forecastTarget}
                    onChange={(e) => setForecastTarget(Number(e.target.value) || 20)}
                    className="w-28 rounded border border-border-default bg-surface px-3 py-1.5 text-sm"
                  />
                </div>
                <button
                  disabled={forecastLoading || !orgId}
                  onClick={async () => {
                    if (!orgId) return;
                    setForecastLoading(true);
                    const p = new URLSearchParams({ targetItems: String(forecastTarget) });
                    if (teamId) p.set('teamId', teamId);
                    try {
                      const r = await api.get<ForecastData>(`/metrics/${orgId}/forecast?${p}`);
                      setForecastData(r);
                    } catch { /* ignore */ }
                    setForecastLoading(false);
                  }}
                  className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {forecastLoading ? 'Simulando…' : 'Simular'}
                </button>
              </div>

              {forecastData && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border-default bg-surface p-6">
                    <h3 className="mb-4 text-lg font-semibold">Resultado ({forecastData.simulations.toLocaleString()} simulações)</h3>
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <span className="text-3xl font-bold text-blue-500">{forecastData.percentiles.p50}</span>
                        <p className="text-xs text-muted-foreground">semanas (P50 — 50% confiança)</p>
                      </div>
                      <div>
                        <span className="text-3xl font-bold text-emerald-500">{forecastData.percentiles.p85}</span>
                        <p className="text-xs text-muted-foreground">semanas (P85 — 85% confiança)</p>
                      </div>
                      <div>
                        <span className="text-3xl font-bold text-amber-500">{forecastData.percentiles.p95}</span>
                        <p className="text-xs text-muted-foreground">semanas (P95 — 95% confiança)</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Para entregar <strong>{forecastData.targetItems} itens</strong>, com 85% de confiança, levará aproximadamente{' '}
                      <strong>{forecastData.percentiles.p85} semanas</strong> (baseado em {forecastData.weeksOfHistory} semanas de histórico).
                    </p>
                  </div>

                  {forecastData.histogram.length > 0 && (
                    <div className="rounded-xl border border-border-default bg-surface p-4">
                      <h4 className="mb-2 text-sm font-medium text-foreground-secondary">Distribuição de cenários</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={forecastData.histogram} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default, #e5e7eb)" />
                          <XAxis dataKey="weeks" tick={{ fontSize: 10 }} label={{ value: 'Semanas', position: 'insideBottomRight', fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip content={({ active, payload, label }) =>
                            active && payload?.length ? (
                              <div className="rounded-lg border border-border-default bg-surface px-2 py-1.5 shadow-lg text-xs">
                                <p className="font-medium">{label} semanas</p>
                                <p>{payload[0].value} simulações</p>
                              </div>
                            ) : null
                          } />
                          <Area type="monotone" dataKey="frequency" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Bugs tab ──────────────────────────────── */}
          {activeTab === 'bugs' && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-foreground-secondary">Bugs</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <MetricCard title="Bugs abertos" value={loading ? '—' : bugsData?.bugsOpen ?? '—'} loading={loading} />
                <MetricCard title="Bugs resolvidos" value={loading ? '—' : bugsData?.bugsResolved ?? '—'} loading={loading} />
                <MetricCard title="MTTR Bugs (mediana)" value={loading ? '—' : bugsData ? `${bugsData.mttrBugsHoursMedian}h` : '—'} loading={loading} />
              </div>
              {bugsData && bugsData.bugs.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3">Key</th>
                        <th className="px-4 py-3">Summary</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Resolved</th>
                        <th className="px-4 py-3 text-right">Lead time (h)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bugsData.bugs.map((b) => (
                        <tr key={b.id} className="border-b border-border-default last:border-0 hover:bg-surface-hover">
                          <td className="px-4 py-3 font-mono text-xs">{b.issueKey}</td>
                          <td className="px-4 py-3 max-w-[280px] truncate text-foreground">{b.summary}</td>
                          <td className="px-4 py-3">{b.status}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {b.resolvedAt ? new Date(b.resolvedAt).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">{b.leadTimeHours ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && (!bugsData || (bugsData.bugsOpen === 0 && bugsData.bugsResolved === 0 && bugsData.bugs.length === 0)) && (
                <p className="text-sm text-muted-foreground">Sem dados de Bugs no período. Verifique a integração Jira e issues do tipo Bug.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function classifyCycleTime(hours?: number): string | undefined {
  if (hours == null) return undefined;
  if (hours <= 24) return 'elite';
  if (hours <= 72) return 'high';
  if (hours <= 168) return 'medium';
  return 'low';
}

function sizeCatStyle(cat: string): string {
  switch (cat?.toLowerCase()) {
    case 'xs': return 'bg-emerald-500/20 text-emerald-400';
    case 's': return 'bg-blue-500/20 text-blue-400';
    case 'm': return 'bg-amber-500/20 text-amber-400';
    case 'l': return 'bg-orange-500/20 text-orange-400';
    case 'xl': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}
