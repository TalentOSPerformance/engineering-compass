'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  ActivityPR,
  PaginationInfo,
  StatusBadge,
  SizeBadge,
  Avatar,
  Pagination,
  TableSkeleton,
  EmptyState,
  timeAgo,
  formatHours,
} from './shared';

interface InProgressResponse {
  items: ActivityPR[];
  pagination: PaginationInfo;
}

export function InProgressTab({
  orgId,
  days,
  teamId,
}: {
  orgId: string;
  days: number;
  teamId?: string;
}) {
  const [data, setData] = useState<InProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      state: 'open',
      days: String(days),
      page: String(page),
      perPage: '25',
    });
    if (teamId) params.set('teamId', teamId);
    if (statusFilter) params.set('state', statusFilter);

    api
      .get<InProgressResponse>(`/metrics/${orgId}/activity/pull-requests?${params}`)
      .then(setData)
      .catch((err) => {
        console.error('[Activity/InProgress]', err);
        setError(err?.message || 'Erro ao buscar PRs em andamento');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [orgId, days, teamId, page, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input-border bg-input px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">Todos abertos</option>
          <option value="open">Open</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="mt-1 text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-60">Verifique se a API esta rodando e se a migration foi aplicada.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="Nenhum PR em andamento no periodo." />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Branch / PR</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Autor</th>
                  <th className="pb-2 pr-4 font-medium">Repositorio</th>
                  <th className="pb-2 pr-4 font-medium text-right">Cycle Time</th>
                  <th className="pb-2 pr-4 font-medium text-right">Size</th>
                  <th className="pb-2 font-medium text-right">Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.items.map((pr) => (
                  <tr key={pr.id} className="hover:bg-surface-hover/50 transition-colors">
                    {/* Branch / PR */}
                    <td className="py-3 pr-4">
                      <div className="space-y-0.5">
                        {pr.headRef && (
                          <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[220px]">
                            {pr.headRef}
                            {pr.baseRef && (
                              <span className="text-muted-foreground/60"> → {pr.baseRef}</span>
                            )}
                          </p>
                        )}
                        <p className="font-medium text-foreground truncate max-w-[280px]">
                          <span className="text-muted-foreground mr-1">#{pr.number}</span>
                          {pr.title}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-4">
                      <StatusBadge status={pr.effectiveStatus} />
                    </td>

                    {/* Autor */}
                    <td className="py-3 pr-4">
                      <Avatar author={pr.author} />
                    </td>

                    {/* Repositorio */}
                    <td className="py-3 pr-4">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px] block">
                        {pr.repository.fullName.split('/').pop()}
                      </span>
                    </td>

                    {/* Cycle Time */}
                    <td className="py-3 pr-4 text-right">
                      <span className="text-xs font-mono">
                        {formatHours(pr.cycleTimeHours)}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="py-3 pr-4 text-right">
                      <SizeBadge size={pr.sizeCategory} />
                      <span className="ml-1.5 text-[11px] text-muted-foreground">
                        +{pr.additions}/-{pr.deletions}
                      </span>
                    </td>

                    {/* Ultima Atividade */}
                    <td className="py-3 text-right">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(pr.updatedAt)}
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
