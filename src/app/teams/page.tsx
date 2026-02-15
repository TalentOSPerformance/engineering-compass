'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

type Team = {
  id: string;
  name: string;
  slug: string;
  _count?: { members: number };
  members?: Array<{ role: string; person: { id: string; displayName: string } }>;
};

export default function TeamsListPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<Team[]>(`/organizations/${orgId}/teams`)
      .then((data) => setTeams(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Times</h1>
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-6 text-yellow-400">
          Nenhuma organização selecionada.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Times</h1>
        <Link
          href="/settings?tab=teams"
          className="rounded-lg bg-surface-hover px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-surface-active transition-colors"
        >
          Criar time / Gerenciar
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface p-8 text-center text-muted-foreground">
          Nenhum time. Crie um em{' '}
          <Link href="/settings?tab=teams" className="text-blue-500 hover:underline">
            Settings → Teams
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium text-right">Membros</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-border-default/50 hover:bg-surface-hover/30 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-foreground-secondary">{team.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {team.members?.[0]?.person?.displayName ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-foreground-secondary">
                    {team._count?.members ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/teams/${team.id}`}
                      className="rounded-lg bg-surface-hover px-3 py-1 text-xs text-foreground-secondary hover:bg-surface-active transition-colors mr-2"
                    >
                      Ver detalhes
                    </Link>
                    <Link
                      href="/settings?tab=teams"
                      className="rounded-lg bg-surface-hover px-3 py-1 text-xs text-foreground-secondary hover:bg-surface-active transition-colors"
                    >
                      Gerenciar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
