'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

interface CareerPath {
  id: string;
  name: string;
  description: string | null;
  stages: unknown[];
  _count?: { assignments: number };
}

interface PersonProgress {
  careerPathId: string;
  careerPathName: string;
  currentStageIndex: number;
  currentStage: { name: string; description?: string } | null;
  nextStage: { name: string } | null;
  meetsCurrent: boolean;
  readyForNext: boolean;
  startedAt: string;
}

export default function CareerPathsPage() {
  const { effectiveOrganizationId: orgId, user } = useAuth();
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [myProgress, setMyProgress] = useState<PersonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([
      api.get<CareerPath[]>(`/career-paths/${orgId}`).catch(() => []),
      user?.personId ? api.get<PersonProgress[]>(`/career-paths/person/${user.personId}/progress`).catch(() => []) : Promise.resolve([]),
    ])
      .then(([p, prog]) => {
        setPaths(Array.isArray(p) ? p : []);
        setMyProgress(Array.isArray(prog) ? prog : []);
      })
      .finally(() => setLoading(false));
  }, [orgId, user?.personId]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Trajetórias de carreira</h1>
        <p className="text-muted-foreground">Selecione uma organização.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Trajetórias de carreira</h1>
        <div className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trajetórias de carreira</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Caminhos de crescimento com estágios baseados em skills (Dreyfus).
        </p>
      </div>

      {myProgress.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Meu progresso</h2>
          <div className="space-y-4">
            {myProgress.map((p) => (
              <div key={p.careerPathId} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="font-medium">{p.careerPathName}</p>
                <p className="text-sm text-muted-foreground">
                  Estágio atual: {p.currentStage?.name ?? '—'}
                  {p.nextStage && ` → Próximo: ${p.nextStage.name}`}
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${paths.find((x) => x.id === p.careerPathId)?.stages?.length
                        ? (100 * (p.currentStageIndex + 1)) / (paths.find((x) => x.id === p.careerPathId)!.stages.length)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Trajetórias disponíveis</h2>
        {paths.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma trajetória cadastrada.</p>
        ) : (
          <ul className="space-y-3">
            {paths.map((path) => (
              <li key={path.id} className="flex justify-between items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <div>
                  <p className="font-medium">{path.name}</p>
                  {path.description && <p className="text-sm text-muted-foreground">{path.description}</p>}
                </div>
                <span className="text-sm text-muted-foreground">{path._count?.assignments ?? 0} pessoas</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
