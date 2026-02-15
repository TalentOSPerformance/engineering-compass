'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  CheckRunItem,
  PaginationInfo,
  ConclusionBadge,
  SummaryCard,
  Pagination,
  TableSkeleton,
  EmptyState,
  timeAgo,
  formatDuration,
} from './shared';

interface CheckRunsResponse {
  summary: {
    totalRuns: number;
    successRate: number;
    avgDurationSeconds: number | null;
  };
  items: CheckRunItem[];
  pagination: PaginationInfo;
}

export function PipelineTab({ orgId, days }: { orgId: string; days: number }) {
  const [data, setData] = useState<CheckRunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [conclusionFilter, setConclusionFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      days: String(days),
      page: String(page),
      perPage: '25',
    });
    if (conclusionFilter) params.set('conclusion', conclusionFilter);

    api
      .get<CheckRunsResponse>(`/metrics/${orgId}/activity/check-runs?${params}`)
      .then(setData)
      .catch((err) => {
        console.error('[Activity/Pipeline]', err);
        setError(err?.message || 'Erro ao buscar check runs');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [orgId, days, page, conclusionFilter]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Total Runs" value={data.summary.totalRuns} />
          <SummaryCard
            label="Taxa de Sucesso"
            value={data.summary.successRate}
            suffix="%"
          />
          <SummaryCard
            label="Duracao Media"
            value={formatDuration(data.summary.avgDurationSeconds)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={conclusionFilter}
          onChange={(e) => { setConclusionFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input-border bg-input px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">Todas as conclusoes</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="cancelled">Cancelled</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="mt-1 text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-60">Verifique se a API esta rodando e se a migration foi aplicada.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="Nenhum check run encontrado no periodo." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Check</th>
                  <th className="pb-2 pr-4 font-medium">Repositorio</th>
                  <th className="pb-2 pr-4 font-medium">PR</th>
                  <th className="pb-2 pr-4 font-medium">Resultado</th>
                  <th className="pb-2 pr-4 font-medium text-right">Duracao</th>
                  <th className="pb-2 font-medium text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.items.map((cr) => (
                  <tr key={cr.id} className="hover:bg-surface-hover/50 transition-colors">
                    {/* Check name */}
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-foreground">
                        {cr.name}
                      </span>
                    </td>

                    {/* Repo */}
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px] block">
                        {cr.repository.fullName.split('/').pop()}
                      </span>
                    </td>

                    {/* PR */}
                    <td className="py-3 pr-4">
                      {cr.pullRequest ? (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                          <span className="text-foreground">#{cr.pullRequest.number}</span>{' '}
                          {cr.pullRequest.title}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Resultado */}
                    <td className="py-3 pr-4">
                      <ConclusionBadge conclusion={cr.conclusion} status={cr.status} />
                    </td>

                    {/* Duracao */}
                    <td className="py-3 pr-4 text-right">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatDuration(cr.durationSeconds)}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="py-3 text-right">
                      <span className="text-xs text-muted-foreground">
                        {cr.startedAt ? timeAgo(cr.startedAt) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
