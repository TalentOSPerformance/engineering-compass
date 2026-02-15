'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

interface Survey {
  id: string;
  title: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  _count?: { responses: number };
}

interface ActiveSurvey extends Survey {
  questions: unknown[];
}

export default function SurveysPage() {
  const { effectiveOrganizationId: orgId, user } = useAuth();
  const [active, setActive] = useState<ActiveSurvey | null>(null);
  const [list, setList] = useState<Survey[]>([]);
  const [aggregates, setAggregates] = useState<{ responseCount: number; enpsAverage: number | null } | null>(null);
  const [enpsScore, setEnpsScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([
      api.get<ActiveSurvey | null>(`/surveys/${orgId}/active`).catch(() => null),
      api.get<Survey[]>(`/surveys/${orgId}/list`).catch(() => []),
    ])
      .then(([a, l]) => {
        setActive(a ?? null);
        setList(Array.isArray(l) ? l : []);
        if (a?.id) {
          return api.get<{ responseCount: number; enpsAverage: number | null }>(`/surveys/${a.id}/aggregates`).then(setAggregates).catch(() => null);
        }
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const handleSubmitEnps = () => {
    if (!active?.id || user?.personId == null || enpsScore == null) return;
    setSubmitting(true);
    api
      .post(`/surveys/${active.id}/responses`, {
        personId: user.personId,
        answers: { score: enpsScore },
        anonymous: false,
      })
      .then(() => {
        setEnpsScore(null);
        api.get(`/surveys/${active.id}/aggregates`).then(setAggregates).catch(() => null);
      })
      .finally(() => setSubmitting(false));
  };

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Pesquisas de satisfação</h1>
        <p className="text-muted-foreground">Selecione uma organização.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Pesquisas de satisfação</h1>
        <div className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pesquisas de satisfação (SPACE)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Responda à pesquisa ativa e veja resultados agregados.
        </p>
      </div>

      {active && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">{active.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Período: {new Date(active.periodStart).toLocaleDateString('pt-BR')} até {new Date(active.periodEnd).toLocaleDateString('pt-BR')}
          </p>
          {active.type === 'enps' && (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                De 0 a 10, qual a probabilidade de você recomendar o ambiente de trabalho para um colega?
              </p>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEnpsScore(n)}
                    className={`h-10 w-10 rounded-lg border text-sm font-medium ${
                      enpsScore === n
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSubmitEnps}
                disabled={enpsScore == null || submitting}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </>
          )}
        </section>
      )}

      {aggregates && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Resultados (agregados)</h2>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">{aggregates.enpsAverage ?? '—'}</p>
              <p className="text-sm text-muted-foreground">eNPS médio</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{aggregates.responseCount}</p>
              <p className="text-sm text-muted-foreground">respostas</p>
            </div>
          </div>
        </section>
      )}

      {list.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Histórico de pesquisas</h2>
          <ul className="space-y-2">
            {list.map((s) => (
              <li key={s.id} className="flex justify-between text-sm">
                <span>{s.title}</span>
                <span className="text-muted-foreground">
                  {new Date(s.periodEnd).toLocaleDateString('pt-BR')}
                  {s._count?.responses != null ? ` · ${s._count.responses} respostas` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!active && list.length === 0 && (
        <p className="text-muted-foreground">Nenhuma pesquisa ativa ou histórica.</p>
      )}
    </div>
  );
}
