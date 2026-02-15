import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';

interface WipData {
  byPerson: Array<{ personId: string; displayName: string; wipCount: number }>;
  total: number;
}

interface ChurnData {
  churnRate: number;
  resolvedCount: number;
  reopenedCount: number;
  period: { start: string; end: string };
}

interface SprintItem {
  sprintId: string;
  name: string;
  completedPoints: number;
  committedPoints: number;
  completionPct: number | null;
  completedAt: string | null;
}

interface SprintsData {
  sprints: SprintItem[];
}

interface FlowEffData {
  avgEfficiencyPct: number;
  medianEfficiencyPct: number;
  byIssueType: Record<string, number>;
  issueCount: number;
}

interface InvestmentCategory {
  name: string;
  label: string;
  storyPoints: number;
  issueCount: number;
  pctOfTotal: number;
}
interface InvestmentData {
  categories: InvestmentCategory[];
  totalPoints: number;
}

export default function MetricsJiraPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days, teamId } = useFilters();
  const [wip, setWip] = useState<WipData | null>(null);
  const [churn, setChurn] = useState<ChurnData | null>(null);
  const [sprints, setSprints] = useState<SprintsData | null>(null);
  const [flowEff, setFlowEff] = useState<FlowEffData | null>(null);
  const [investment, setInvestment] = useState<InvestmentData | null>(null);
  const [sprintReport, setSprintReport] = useState<{ sprintName: string; report: string; stats: Record<string, unknown> } | null>(null);
  const [reportLoading, setReportLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const teamQ = teamId ? `&teamId=${teamId}` : '';
    Promise.all([
      api.get<WipData>(`/metrics/${orgId}/jira/wip?${teamQ}`),
      api.get<ChurnData>(`/metrics/${orgId}/jira/churn-rate?days=${days}${teamQ}`),
      api.get<SprintsData>(`/metrics/${orgId}/jira/sprints?lastN=10${teamQ}`),
      api.get<FlowEffData>(`/metrics/${orgId}/jira/flow-efficiency?days=${days}${teamQ}`),
      api.get<InvestmentData>(`/metrics/${orgId}/jira/investment?days=${days}${teamQ}`),
    ])
      .then(([w, c, s, fe, inv]) => {
        setWip(w);
        setChurn(c);
        setSprints(s);
        setFlowEff(fe);
        setInvestment(inv);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, teamId, days]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Métricas Jira</h1>
        <p className="text-muted-foreground">Selecione uma organização.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Métricas Jira</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Métricas Jira</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Métricas Jira</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          WIP, taxa de reabertura (churn) e velocity/completion de sprints — últimos {days} dias onde aplicável.
        </p>
      </div>

      {/* Flow Efficiency */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Flow Efficiency</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Percentual de tempo ativo (touch time) vs tempo total (touch + wait) das issues resolvidas no período.
        </p>
        {flowEff && flowEff.issueCount > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-3xl font-bold">{flowEff.avgEfficiencyPct}%</span>
                <p className="text-sm text-muted-foreground">média</p>
              </div>
              <div>
                <span className="text-3xl font-bold">{flowEff.medianEfficiencyPct}%</span>
                <p className="text-sm text-muted-foreground">mediana</p>
              </div>
              <div>
                <span className="text-xl font-semibold">{flowEff.issueCount}</span>
                <p className="text-sm text-muted-foreground">issues analisadas</p>
              </div>
            </div>
            {Object.keys(flowEff.byIssueType).length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Por tipo de issue</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(flowEff.byIssueType).map(([type, pct]) => (
                    <div key={type} className="rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                      <span className="font-medium">{type}</span>{' '}
                      <span className={pct >= 40 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Nenhuma issue com dados de flow efficiency no período.</p>
        )}
      </section>

      {/* Investment Distribution */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Alocação de investimento</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Distribuição de esforço (story points) por tipo de trabalho — New Features (CapEx) vs Bug Fixes / Maintenance (OpEx).
        </p>
        {investment && investment.categories.length > 0 ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{investment.totalPoints} pts</span></p>
            <div className="space-y-2">
              {investment.categories.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-36 truncate text-sm font-medium">{c.label}</div>
                  <div className="flex-1">
                    <div className="h-5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-5 rounded-full ${
                          c.name === 'Story' ? 'bg-blue-500' : c.name === 'Bug' ? 'bg-red-400' : 'bg-zinc-400'
                        }`}
                        style={{ width: `${Math.max(c.pctOfTotal, 2)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-sm font-medium">{c.pctOfTotal}%</span>
                  <span className="w-20 text-right text-xs text-muted-foreground">{c.storyPoints} pts ({c.issueCount})</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Nenhuma issue resolvida no período.</p>
        )}
      </section>

      {/* WIP */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Trabalho em progresso (WIP)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Issues em status não final (ex.: To Do, In Progress, In Review) por pessoa.
        </p>
        <div className="flex items-baseline gap-4">
          <span className="text-3xl font-bold">{wip?.total ?? 0}</span>
          <span className="text-muted-foreground">issues em andamento</span>
        </div>
        {wip && wip.byPerson.length > 0 && (
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-700">
            {wip.byPerson.slice(0, 15).map((p) => (
              <li key={p.personId} className="flex justify-between py-2">
                <span>{p.displayName}</span>
                <span className="font-medium">{p.wipCount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Churn Rate */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Taxa de reabertura (Churn)</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Percentual de issues resolvidas no período que foram reabertas depois.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-3xl font-bold">{churn ? Math.round(churn.churnRate * 100) : 0}%</span>
            <p className="text-sm text-muted-foreground">churn rate</p>
          </div>
          <div>
            <span className="text-xl font-semibold">{churn?.resolvedCount ?? 0}</span>
            <p className="text-sm text-muted-foreground">resolvidas no período</p>
          </div>
          <div>
            <span className="text-xl font-semibold">{churn?.reopenedCount ?? 0}</span>
            <p className="text-sm text-muted-foreground">reabertas</p>
          </div>
        </div>
      </section>

      {/* Sprint Velocity & Completion */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Velocity e completion de sprints</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Últimos 10 sprints fechados com issues atribuídas à organização/time.
        </p>
        {sprints?.sprints?.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-2 text-left font-medium">Sprint</th>
                    <th className="py-2 text-right font-medium">Committed</th>
                    <th className="py-2 text-right font-medium">Completed</th>
                    <th className="py-2 text-right font-medium">Completion %</th>
                    <th className="py-2 text-right font-medium">Fim</th>
                    <th className="py-2 text-right font-medium">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {sprints.sprints.map((s) => (
                    <tr key={s.sprintId} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-2">{s.name}</td>
                      <td className="py-2 text-right">{s.committedPoints}</td>
                      <td className="py-2 text-right">{s.completedPoints}</td>
                      <td className="py-2 text-right">{s.completionPct != null ? `${s.completionPct}%` : '—'}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          disabled={reportLoading === s.sprintId}
                          onClick={async () => {
                            if (!orgId) return;
                            setReportLoading(s.sprintId);
                            try {
                              const r = await api.get<{ sprintName: string; report: string; stats: Record<string, unknown> }>(
                                `/insights-dashboard/${orgId}/sprint-report/${s.sprintId}`,
                              );
                              setSprintReport(r);
                            } catch { /* ignore */ }
                            setReportLoading(null);
                          }}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {reportLoading === s.sprintId ? 'Gerando…' : 'Gerar report'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sprint Report Modal */}
            {sprintReport && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Report: {sprintReport.sprintName}</h3>
                  <button onClick={() => setSprintReport(null)} className="text-sm text-muted-foreground hover:underline">
                    Fechar
                  </button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {sprintReport.report}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Nenhum sprint fechado encontrado para o escopo selecionado.</p>
        )}
      </section>
    </div>
  );
}
