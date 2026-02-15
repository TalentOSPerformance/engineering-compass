import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  DeployItem,
  PaginationInfo,
  DeployStatusBadge,
  SummaryCard,
  Pagination,
  TableSkeleton,
  EmptyState,
  timeAgo,
} from './shared';

interface DeploysResponse {
  summary: {
    totalDeploys: number;
    successRate: number;
    deploysPerDay: number;
  };
  items: DeployItem[];
  pagination: PaginationInfo;
}

export function DeploysTab({ orgId, days }: { orgId: string; days: number }) {
  const [data, setData] = useState<DeploysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [envFilter, setEnvFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      days: String(days),
      page: String(page),
      perPage: '25',
    });
    if (envFilter) params.set('environment', envFilter);
    if (statusFilter) params.set('status', statusFilter);

    api
      .get<DeploysResponse>(`/metrics/${orgId}/activity/deployments?${params}`)
      .then(setData)
      .catch((err) => {
        console.error('[Activity/Deploys]', err);
        setError(err?.message || 'Erro ao buscar deployments');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [orgId, days, page, envFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Total Deploys" value={data.summary.totalDeploys} />
          <SummaryCard
            label="Taxa de Sucesso"
            value={data.summary.successRate}
            suffix="%"
          />
          <SummaryCard
            label="Deploys / Dia"
            value={data.summary.deploysPerDay}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={envFilter}
          onChange={(e) => { setEnvFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input-border bg-input px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">Todos os ambientes</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="preview">Preview</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input-border bg-input px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">Todos os status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="mt-1 text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-60">Verifique se a API esta rodando e se a migration foi aplicada.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="Nenhum deploy encontrado no periodo." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Environment</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Repositorio</th>
                  <th className="pb-2 pr-4 font-medium">Commit</th>
                  <th className="pb-2 font-medium text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.items.map((deploy) => (
                  <tr key={deploy.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 capitalize">
                        {deploy.environment}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <DeployStatusBadge status={deploy.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px] block">
                        {deploy.repository.fullName.split('/').pop()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {deploy.commitSha ? (
                        <span className="text-xs font-mono text-muted-foreground">
                          {deploy.commitSha.slice(0, 7)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(deploy.deployedAt)}
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
