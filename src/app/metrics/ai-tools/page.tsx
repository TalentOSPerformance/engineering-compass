'use client';

import { useEffect, useState, useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';
import { MetricCard } from '@/components/charts/metric-card';
import { AreaChartCard } from '@/components/charts/area-chart-card';
import { BarChartCard } from '@/components/charts/bar-chart-card';

interface CopilotDaily {
  date: string;
  totalActiveUsers: number;
  totalEngagedUsers: number;
  codeCompletions: {
    totalSuggestions: number;
    totalAcceptances: number;
    totalLinesAccepted: number;
    acceptanceRate: number;
  };
  chat: {
    totalChats: number;
    totalInsertions: number;
    totalCopies: number;
  };
}

interface CopilotData {
  adoptionRate: number;
  activeUsersAvg: number;
  engagedUsersAvg: number;
  totalLinesAccepted: number;
  totalSuggestions: number;
  acceptanceRate: number;
  dailyMetrics: CopilotDaily[];
  byLanguage: { name: string; suggestions: number; acceptances: number; acceptanceRate: number }[];
  byEditor: { name: string; suggestions: number; acceptances: number }[];
}

export default function AIToolsPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days } = useFilters();

  const [data, setData] = useState<CopilotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);

    const since = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const until = format(new Date(), 'yyyy-MM-dd');

    api
      .get<CopilotData>(`/copilot/${orgId}/metrics?since=${since}&until=${until}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orgId, days]);

  // Chart data
  const activeUsersChart = useMemo(() => {
    if (!data?.dailyMetrics) return [];
    return data.dailyMetrics.map((d) => ({
      label: d.date.slice(5), // MM-DD
      value: d.totalActiveUsers,
    }));
  }, [data]);

  const suggestionsChart = useMemo(() => {
    if (!data?.dailyMetrics) return [];
    return data.dailyMetrics.map((d) => ({
      label: d.date.slice(5),
      value: d.codeCompletions.totalSuggestions,
    }));
  }, [data]);

  const linesChart = useMemo(() => {
    if (!data?.dailyMetrics) return [];
    return data.dailyMetrics.map((d) => ({
      label: d.date.slice(5),
      value: d.codeCompletions.totalLinesAccepted,
    }));
  }, [data]);

  const acceptanceChart = useMemo(() => {
    if (!data?.dailyMetrics) return [];
    return data.dailyMetrics.map((d) => ({
      label: d.date.slice(5),
      value: d.codeCompletions.acceptanceRate,
    }));
  }, [data]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Tools</h1>
        <p className="text-muted">Selecione uma organizacao.</p>
      </div>
    );
  }

  const hasData = data && data.dailyMetrics.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          GitHub Copilot usage — ultimos {days} dias
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Adoption Rate"
          value={data ? `${data.adoptionRate}%` : '—'}
          loading={loading}
        />
        <MetricCard
          title="Active Users / day"
          value={data?.activeUsersAvg ?? '—'}
          loading={loading}
        />
        <MetricCard
          title="Engaged Users / day"
          value={data?.engagedUsersAvg ?? '—'}
          loading={loading}
        />
        <MetricCard
          title="Lines Accepted"
          value={data ? data.totalLinesAccepted.toLocaleString() : '—'}
          loading={loading}
        />
        <MetricCard
          title="Suggestions"
          value={data ? data.totalSuggestions.toLocaleString() : '—'}
          loading={loading}
        />
        <MetricCard
          title="Acceptance Rate"
          value={data ? `${data.acceptanceRate}%` : '—'}
          loading={loading}
        />
      </div>

      {!loading && !hasData && (
        <div className="rounded-xl border border-border-default bg-surface p-8 text-center max-w-xl mx-auto">
          <p className="text-lg font-medium text-foreground-secondary">Nenhum dado Copilot disponível</p>
          <ul className="mt-3 text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
            <li>
              Em <strong>Integrações → GitHub</strong>, cadastre uma conexão com o <strong>slug da sua organização</strong> (campo &quot;Organização GitHub&quot;) e um token com permissão para métricas Copilot.
            </li>
            <li>
              A API de métricas Copilot do GitHub exige <strong>token Classic (PAT)</strong> com escopo <code className="rounded bg-surface-hover px-1 py-0.5">read:org</code> ou <code className="rounded bg-surface-hover px-1 py-0.5">manage_billing:copilot</code>. <strong>Tokens Fine-Grained</strong> podem não ser suportados por essa API; use um Classic PAT para Copilot.
            </li>
            <li>
              Na organização no GitHub, a política de acesso &quot;Copilot Metrics API&quot; deve estar habilitada (somente owners e billing managers podem ver métricas).
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Dúvidas: <a href="/help" className="underline text-foreground-secondary">FAQ e guias</a> → GitHub Copilot.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Trend Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AreaChartCard
              title="Active Users / day"
              data={activeUsersChart}
              dataKey="value"
              color="#3b82f6"
              height={200}
            />
            <AreaChartCard
              title="Code Suggestions / day"
              data={suggestionsChart}
              dataKey="value"
              color="#8b5cf6"
              height={200}
            />
            <AreaChartCard
              title="Lines Accepted / day"
              data={linesChart}
              dataKey="value"
              color="#10b981"
              height={200}
            />
            <AreaChartCard
              title="Acceptance Rate (%) / day"
              data={acceptanceChart}
              dataKey="value"
              color="#f59e0b"
              unit="%"
              height={200}
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BarChartCard
              title="Suggestions by Language"
              data={data!.byLanguage.slice(0, 10).map((l) => ({
                name: l.name,
                value: l.suggestions,
              }))}
              dataKey="value"
              nameKey="name"
              layout="vertical"
              height={Math.max(200, data!.byLanguage.slice(0, 10).length * 32)}
            />
            <BarChartCard
              title="Suggestions by Editor"
              data={data!.byEditor.map((e) => ({
                name: e.name,
                value: e.suggestions,
              }))}
              dataKey="value"
              nameKey="name"
              colors={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
              height={200}
            />
          </div>

          {/* Language acceptance rates table */}
          <div className="rounded-xl border border-border-default bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground-secondary">Acceptance Rate by Language</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">Language</th>
                    <th className="px-4 py-2 text-right">Suggestions</th>
                    <th className="px-4 py-2 text-right">Acceptances</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.byLanguage.slice(0, 15).map((l) => (
                    <tr key={l.name} className="border-b border-border-default last:border-0 hover:bg-surface-hover">
                      <td className="px-4 py-2 font-medium text-foreground">{l.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground-secondary">{l.suggestions.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono text-foreground-secondary">{l.acceptances.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-foreground">{l.acceptanceRate}%</td>
                      <td className="px-4 py-2 w-32">
                        <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${l.acceptanceRate}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
