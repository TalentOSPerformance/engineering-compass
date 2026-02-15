'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, Send } from 'lucide-react';

interface HealthScoreResult {
  score: number;
  trendPct: number;
  breakdown: { dora: number; flow: number; quality: number; throughput: number };
  period: { start: string; end: string };
}

interface DigestResult {
  content: string;
  period: { start: string; end: string };
}

interface ReviewerFatigueItem {
  prId: string;
  title: string;
  reviewerId: string | null;
  reviewMinutes: number;
  size: number;
}

interface BurnoutRiskItem {
  personId: string;
  displayName: string;
  score: number;
  factors: string[];
}

interface AnomalousPRItem {
  prId: string;
  number: number;
  title: string;
  repo: string;
  reason: string;
  size?: number;
  reviewMinutes?: number;
}

interface DashboardData {
  healthScore: HealthScoreResult;
  digest: DigestResult;
  bottlenecks: BottleneckItem[];
  correlations: CorrelationItem[];
  recommendations: { items: RecommendationItem[] };
  reviewerFatigue: ReviewerFatigueItem[];
  burnoutRisk: BurnoutRiskItem[];
  anomalousPRs: AnomalousPRItem[];
}

interface BottleneckItem {
  type: string;
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  metrics: Record<string, number | string>;
  trend?: number;
}

interface CorrelationItem {
  title: string;
  description: string;
  coefficient?: number;
  metrics: Record<string, number>;
}

interface RecommendationItem {
  title: string;
  why: string;
  impact: string;
  metrics: string[];
}

export default function InsightsDashboardPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days, teamId, teams } = useFilters();
  const teamName = teamId ? teams.find((t) => t.id === teamId)?.name : null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [askQuestion, setAskQuestion] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askHistory, setAskHistory] = useState<Array<{ question: string; answer: string }>>([]);

  interface OpReviewMetrics {
    breakdown: { totalCycleTimeP75: number; prCount: number };
    wip: { total: number };
    throughput: { prsMerged: number; timelineDaily?: Array<{ date: string; label: string; prsMerged: number }> };
    processLimits: { dataPoints: Array<{ week: string; value: number }> };
    histogram: { buckets: Array<{ faixa: string; count: number }> };
    cfd: { points: Array<{ date: string; label: string; toDo: number; doing: number; done: number }> };
    aging: { points: Array<{ date: string; label: string; wip: number; mediaDias: number }> };
  }
  const [opReview, setOpReview] = useState<OpReviewMetrics | null>(null);
  const [opReviewLoading, setOpReviewLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ days: String(days) });
    if (teamId) params.set('teamId', teamId);
    api
      .get<DashboardData>(`/insights-dashboard/${orgId}?${params}`)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, days, teamId]);

  useEffect(() => {
    if (!orgId || !data) return;
    setOpReviewLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (teamId) params.set('teamId', teamId);
    const base = `/metrics/${orgId}`;
    Promise.all([
      api.get<{ totalCycleTimeP75: number; prCount: number }>(`${base}/cycle-time/breakdown?${params}`),
      api.get<{ total: number }>(`${base}/jira/wip?${params}`),
      api.get<{ prsMerged: number; timelineDaily?: Array<{ date: string; label: string; prsMerged: number }> }>(`${base}/throughput?${params}`),
      api.get<{ dataPoints: Array<{ week: string; value: number }> }>(`${base}/process-limits?${params}&metric=cycle_time`),
      api.get<{ buckets: Array<{ faixa: string; count: number }> }>(`${base}/cycle-time/histogram?${params}`),
      api.get<{ points: Array<{ date: string; label: string; toDo: number; doing: number; done: number }> }>(`${base}/jira/cumulative-flow?${params}`),
      api.get<{ points: Array<{ date: string; label: string; wip: number; mediaDias: number }> }>(`${base}/jira/aging-chart?${params}`),
    ])
      .then(([breakdown, wip, throughput, processLimits, histogram, cfd, aging]) => {
        setOpReview({
          breakdown: breakdown as OpReviewMetrics['breakdown'],
          wip: wip as OpReviewMetrics['wip'],
          throughput: throughput as OpReviewMetrics['throughput'],
          processLimits: processLimits as OpReviewMetrics['processLimits'],
          histogram: histogram as OpReviewMetrics['histogram'],
          cfd: cfd as OpReviewMetrics['cfd'],
          aging: aging as OpReviewMetrics['aging'],
        });
      })
      .catch(() => setOpReview(null))
      .finally(() => setOpReviewLoading(false));
  }, [orgId, teamId, days, data]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Insights Dashboard</h1>
        <p className="text-muted-foreground">Selecione uma organização.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Insights Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Insights Dashboard</h1>
        <p className="text-red-500">{error ?? 'Erro ao carregar dados.'}</p>
      </div>
    );
  }

  const handleAsk = () => {
    if (!orgId || !askQuestion.trim()) return;
    setAskLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (teamId) params.set('teamId', teamId);
    api
      .post<{ answer: string }>(`/insights-dashboard/${orgId}/ask?${params}`, {
        question: askQuestion.trim(),
      })
      .then((res) => {
        setAskHistory((prev) => [...prev, { question: askQuestion.trim(), answer: res.answer }]);
        setAskQuestion('');
      })
      .catch(() => {
        setAskHistory((prev) => [
          ...prev,
          { question: askQuestion.trim(), answer: 'Erro ao obter resposta. Tente novamente.' },
        ]);
      })
      .finally(() => setAskLoading(false));
  };

  const { healthScore, digest, bottlenecks, correlations, recommendations, reviewerFatigue = [], burnoutRisk = [], anomalousPRs = [] } = data;
  const trendIcon =
    healthScore.trendPct > 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    ) : healthScore.trendPct < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-500" />
    ) : (
      <Minus className="h-4 w-4 text-zinc-400" />
    );

  const periodLabel = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão consolidada e análises para apoiar a tomada de decisão — últimos {days} dias
        </p>
      </div>

      {/* Revisão de Operações (Operation Review) — mesmo tema da página */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Revisão de Operações
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {teamName ?? 'Todos os times'} · {periodLabel}
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground-secondary">Resumo</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground-secondary">
              {digest.content.split('\n\n').slice(0, 3).map((p, i) => (
                <p key={i} className="mb-2 last:mb-0">{p}</p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-foreground-secondary">
              Destaques e informações relevantes
            </h3>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li>
                <span className="font-medium text-foreground">Health Score:</span>{' '}
                {healthScore.score}/100
                {healthScore.trendPct !== 0 && (
                  <span className={healthScore.trendPct > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                    {' '}({healthScore.trendPct > 0 ? '+' : ''}{healthScore.trendPct}% vs período anterior)
                  </span>
                )}
              </li>
              {bottlenecks.length > 0 && (
                <li>
                  <span className="font-medium text-foreground">Gargalos:</span>{' '}
                  {bottlenecks.length} detectado(s) — {bottlenecks.slice(0, 2).map((b) => b.title).join('; ')}
                  {bottlenecks.length > 2 && ' …'}
                </li>
              )}
              {recommendations.items?.length > 0 && (
                <li>
                  <span className="font-medium text-foreground">Recomendações:</span>{' '}
                  {recommendations.items.length} ação(ões) sugerida(s) para o período
                </li>
              )}
              {reviewerFatigue.length > 0 && (
                <li>
                  <span className="font-medium text-foreground">Revisões superficiais:</span>{' '}
                  {reviewerFatigue.length} PR(s) com aprovação muito rápida em mudanças grandes
                </li>
              )}
              {burnoutRisk.length > 0 && (
                <li>
                  <span className="font-medium text-foreground">Risco de burnout:</span>{' '}
                  {burnoutRisk.length} pessoa(s) com sinais de sobrecarga
                </li>
              )}
              {anomalousPRs.length > 0 && (
                <li>
                  <span className="font-medium text-foreground">Atividade atípica:</span>{' '}
                  {anomalousPRs.length} PR(s) para revisão adicional (tamanho, aprovação rápida ou novo autor)
                </li>
              )}
              {bottlenecks.length === 0 &&
                recommendations.items?.length === 0 &&
                reviewerFatigue.length === 0 &&
                burnoutRisk.length === 0 &&
                anomalousPRs.length === 0 && (
                  <li className="text-muted-foreground">Nenhum destaque crítico no período.</li>
                )}
            </ul>
          </div>

          {/* Métricas — dados reais que subsidiam o insight */}
          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-secondary">
              Métricas
            </h3>

            {opReviewLoading ? (
              <div className="space-y-4">
                <div className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-56 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ) : opReview ? (
              <>
                {/* Resumo numérico */}
                <div className="mb-6">
                  <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Resumo</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="text-xs text-muted-foreground">Cycle Time (P75)</div>
                      <div className="text-lg font-semibold text-foreground">
                        {opReview.breakdown.prCount > 0 ? `${Math.round(opReview.breakdown.totalCycleTimeP75)} h` : '—'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="text-xs text-muted-foreground">WIP (Jira)</div>
                      <div className="text-lg font-semibold text-foreground">{opReview.wip.total}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="text-xs text-muted-foreground">Throughput (PRs)</div>
                      <div className="text-lg font-semibold text-foreground">{opReview.throughput.prsMerged}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="text-xs text-muted-foreground">Taxa entrega/dia</div>
                      <div className="text-lg font-semibold text-foreground">
                        {days > 0 && opReview.throughput.prsMerged >= 0 ? (opReview.throughput.prsMerged / days).toFixed(2) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CFD — Cumulative Flow (Jira) */}
                {opReview.cfd.points.length > 0 ? (
                  <div className="mb-6">
                    <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Cumulative Flow Diagram (CFD)</h4>
                    <p className="mb-3 text-xs text-muted-foreground">Itens por status (To Do / Doing / Done) ao longo do tempo — Jira.</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={opReview.cfd.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="done" stackId="1" fill="#22c55e" stroke="#22c55e" fillOpacity={0.7} name="Done" />
                          <Area type="monotone" dataKey="doing" stackId="1" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.7} name="Doing" />
                          <Area type="monotone" dataKey="toDo" stackId="1" fill="#6366f1" stroke="#6366f1" fillOpacity={0.7} name="To Do" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Cumulative Flow Diagram (CFD)</h4>
                    <p className="text-sm text-muted-foreground">Sem dados de Jira no período. Configure integração e status history.</p>
                  </div>
                )}

                {/* Cycle Time — Process Limits (PRs) */}
                {opReview.processLimits.dataPoints.length > 0 ? (
                  <div className="mb-6">
                    <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Cycle Time (Process Limits)</h4>
                    <p className="mb-3 text-xs text-muted-foreground">Média semanal em horas — PRs mergeados.</p>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={opReview.processLimits.dataPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Média (h)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Cycle Time (Process Limits)</h4>
                    <p className="text-sm text-muted-foreground">Sem PRs mergeados no período para calcular médias semanais.</p>
                  </div>
                )}

                {/* Histograma Cycle Time (PRs) */}
                {opReview.histogram.buckets.some((b) => b.count > 0) ? (
                  <div className="mb-6">
                    <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Distribuição Cycle Time (histograma)</h4>
                    <p className="mb-3 text-xs text-muted-foreground">Quantidade de PRs por faixa de tempo — mergeados no período.</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={opReview.histogram.buckets} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                          <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="PRs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Distribuição Cycle Time</h4>
                    <p className="text-sm text-muted-foreground">Sem PRs mergeados no período.</p>
                  </div>
                )}

                {/* Aging Chart (Jira) */}
                {opReview.aging.points.length > 0 && opReview.aging.points.some((p) => p.wip > 0 || p.mediaDias > 0) ? (
                  <div className="mb-6">
                    <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Aging Chart</h4>
                    <p className="mb-3 text-xs text-muted-foreground">WIP e idade média em dias — Jira.</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={opReview.aging.points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar yAxisId="left" dataKey="wip" fill="#6366f1" radius={[4, 4, 0, 0]} name="WIP" />
                          <Line yAxisId="right" type="monotone" dataKey="mediaDias" stroke="#f59e0b" strokeWidth={2} name="Média dias" dot={{ r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Aging Chart</h4>
                    <p className="text-sm text-muted-foreground">Sem dados de WIP/aging no período.</p>
                  </div>
                )}

                {/* Throughput (PRs) */}
                {opReview.throughput.timelineDaily && opReview.throughput.timelineDaily.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Throughput</h4>
                    <p className="mb-3 text-xs text-muted-foreground">PRs mergeados por dia.</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={opReview.throughput.timelineDaily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="prsMerged" fill="#22c55e" stroke="#22c55e" fillOpacity={0.7} name="PRs mergeados" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Throughput</h4>
                    <p className="text-sm text-muted-foreground">Sem dados de throughput diário no período.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-sm text-muted-foreground">Não foi possível carregar as métricas.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Health Score */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Engineering Health Score</h2>
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums">{healthScore.score}</span>
            <span className="text-2xl text-zinc-500">/ 100</span>
          </div>
          <div className="flex items-center gap-1">
            {trendIcon}
            <span className="text-sm text-muted-foreground">
              {healthScore.trendPct > 0 ? '+' : ''}
              {healthScore.trendPct}% vs período anterior
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'DORA', value: healthScore.breakdown.dora },
            { label: 'Flow', value: healthScore.breakdown.flow },
            { label: 'Quality', value: healthScore.breakdown.quality },
            { label: 'Throughput', value: healthScore.breakdown.throughput },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Executive Digest */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Resumo executivo (IA)</h2>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {digest.content.split('\n\n').map((p, i) => (
            <p key={i} className="mb-2 last:mb-0">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Reviewer fatigue (superficial reviews) */}
      {reviewerFatigue.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Revisões superficiais</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            PRs com 500+ linhas aprovados em menos de 5 minutos — possível fadiga de revisor ou revisão superficial.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {reviewerFatigue.slice(0, 10).map((item) => (
                <li key={item.prId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="font-medium truncate max-w-[60%]">{item.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.size} linhas · aprovado em {item.reviewMinutes} min
                  </span>
                </li>
              ))}
            </ul>
            {reviewerFatigue.length > 10 && (
              <p className="px-4 py-2 text-sm text-muted-foreground border-t border-zinc-200 dark:border-zinc-700">
                +{reviewerFatigue.length - 10} outros
              </p>
            )}
          </div>
        </section>
      )}

      {/* Burnout risk */}
      {burnoutRisk.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Risco de burnout</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Pessoas com sinais de sobrecarga (commits em fim de semana, WIP acima da média). Recomenda-se reduzir WIP e pausas.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {burnoutRisk.slice(0, 8).map((item) => (
                <li key={item.personId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-sm text-muted-foreground">Score: {item.score}</span>
                  <div className="w-full text-xs text-muted-foreground">
                    {item.factors.join('; ')}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Anomalous PRs */}
      {anomalousPRs.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Atividade atípica (PRs para revisão adicional)</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            PRs que se destacam por tamanho, aprovação muito rápida ou primeiro PR do autor no repositório.
          </p>
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {anomalousPRs.slice(0, 10).map((pr) => (
                <li key={pr.prId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate block">{pr.title}</span>
                    <span className="text-xs text-muted-foreground">{pr.repo} #{pr.number}</span>
                  </div>
                  <span className="text-sm text-amber-600 dark:text-amber-400">{pr.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Gargalos detectados</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bottlenecks.map((b, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${
                  b.severity === 'critical'
                    ? 'border-red-500/30 bg-red-500/5 dark:bg-red-500/10'
                    : 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10'
                }`}
              >
                <h3 className="font-medium">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                {Object.keys(b.metrics).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(b.metrics).map(([k, v]) => (
                      <span key={k} className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Correlations */}
      {correlations.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Correlações</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {correlations.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-medium">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                {c.coefficient != null && (
                  <p className="mt-2 text-xs text-muted-foreground">Coeficiente: {c.coefficient}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.items?.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recomendações</h2>
          <ul className="space-y-4">
            {recommendations.items.map((r, i) => (
              <li
                key={i}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-medium">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Por quê:</strong> {r.why}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Impacto:</strong> {r.impact}
                </p>
                {r.metrics?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.metrics.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ask AI */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Perguntar à IA</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Faça perguntas em linguagem natural sobre as métricas do período. Ex.: &quot;Por que o cycle time aumentou?&quot;
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={askQuestion}
            onChange={(e) => setAskQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Sua pergunta..."
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={askLoading || !askQuestion.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {askLoading ? '...' : 'Enviar'}
          </button>
        </div>
        {askHistory.length > 0 && (
          <div className="mt-6 space-y-4">
            {askHistory.slice(-5).reverse().map((item, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-sm font-medium text-muted-foreground">Pergunta: {item.question}</p>
                <p className="mt-2 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
