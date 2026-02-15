'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  ActivityPR,
  PaginationInfo,
  StatusBadge,
  SizeBadge,
  Avatar,
  ConclusionBadge,
  Pagination,
  TableSkeleton,
  EmptyState,
  timeAgo,
  formatHours,
} from './shared';

interface PRsResponse {
  items: ActivityPR[];
  pagination: PaginationInfo;
}

export function PullRequestsTab({
  orgId,
  days,
  teamId,
}: {
  orgId: string;
  days: number;
  teamId?: string;
}) {
  const [data, setData] = useState<PRsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      days: String(days),
      page: String(page),
      perPage: '25',
    });
    if (teamId) params.set('teamId', teamId);
    if (stateFilter) params.set('state', stateFilter);

    api
      .get<PRsResponse>(`/metrics/${orgId}/activity/pull-requests?${params}`)
      .then((res) => {
        if (sizeFilter) {
          res.items = res.items.filter((pr) => pr.sizeCategory === sizeFilter);
        }
        setData(res);
      })
      .catch((err) => {
        console.error('[Activity/PullRequests]', err);
        setError(err?.message || 'Erro ao buscar pull requests');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [orgId, days, teamId, page, stateFilter, sizeFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={stateFilter}
          onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input-border bg-input px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">Todos os estados</option>
          <option value="open">Open</option>
          <option value="merged">Merged</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={sizeFilter}
          onChange={(e) => { setSizeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input-border bg-input px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">Todos os tamanhos</option>
          <option value="xs">XS</option>
          <option value="s">S</option>
          <option value="m">M</option>
          <option value="l">L</option>
          <option value="xl">XL</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="mt-1 text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-60">Verifique se a API esta rodando e se a migration foi aplicada.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="Nenhum PR encontrado no periodo." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">PR</th>
                  <th className="pb-2 pr-3 font-medium">Branch</th>
                  <th className="pb-2 pr-3 font-medium">Autor</th>
                  <th className="pb-2 pr-3 font-medium">Repo</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium text-right">Size</th>
                  <th className="pb-2 pr-3 font-medium text-right">Cycle</th>
                  <th className="pb-2 pr-3 font-medium text-right">Pickup</th>
                  <th className="pb-2 pr-3 font-medium text-right">Review</th>
                  <th className="pb-2 pr-3 font-medium text-center">Reviews</th>
                  <th className="pb-2 pr-3 font-medium text-center">CI</th>
                  <th className="pb-2 font-medium text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.items.map((pr) => (
                  <tr key={pr.id} className="hover:bg-surface-hover/50 transition-colors">
                    {/* PR */}
                    <td className="py-3 pr-3">
                      <p className="font-medium text-foreground truncate max-w-[200px]">
                        <span className="text-muted-foreground mr-1">#{pr.number}</span>
                        {pr.title}
                      </p>
                    </td>

                    {/* Branch */}
                    <td className="py-3 pr-3">
                      {pr.headRef ? (
                        <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px] block">
                          {pr.headRef}
                          {pr.baseRef && (
                            <span className="text-muted-foreground/60"> → {pr.baseRef}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Autor */}
                    <td className="py-3 pr-3">
                      <Avatar author={pr.author} />
                    </td>

                    {/* Repo */}
                    <td className="py-3 pr-3">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] block">
                        {pr.repository.fullName.split('/').pop()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-3">
                      <StatusBadge status={pr.effectiveStatus} />
                    </td>

                    {/* Size */}
                    <td className="py-3 pr-3 text-right">
                      <SizeBadge size={pr.sizeCategory} />
                    </td>

                    {/* Cycle */}
                    <td className="py-3 pr-3 text-right font-mono text-xs">
                      {formatHours(pr.cycleTimeHours)}
                    </td>

                    {/* Pickup */}
                    <td className="py-3 pr-3 text-right font-mono text-xs">
                      {formatHours(pr.pickupTimeHours)}
                    </td>

                    {/* Review */}
                    <td className="py-3 pr-3 text-right font-mono text-xs">
                      {formatHours(pr.reviewTimeHours)}
                    </td>

                    {/* Reviews */}
                    <td className="py-3 pr-3 text-center">
                      <span className="text-xs">
                        {pr.reviewsSummary.total > 0 ? (
                          <span>
                            {pr.reviewsSummary.approved > 0 && (
                              <span className="text-emerald-400">{pr.reviewsSummary.approved}✓</span>
                            )}
                            {pr.reviewsSummary.changesRequested > 0 && (
                              <span className="text-orange-400 ml-1">{pr.reviewsSummary.changesRequested}✗</span>
                            )}
                            {pr.reviewsSummary.approved === 0 && pr.reviewsSummary.changesRequested === 0 && (
                              <span className="text-muted-foreground">{pr.reviewsSummary.total}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </td>

                    {/* CI */}
                    <td className="py-3 pr-3 text-center">
                      {pr.latestCheckRun ? (
                        <ConclusionBadge
                          conclusion={pr.latestCheckRun.conclusion}
                          status={pr.latestCheckRun.status}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Data */}
                    <td className="py-3 text-right">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(pr.mergedAt || pr.closedAt || pr.createdAt)}
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
