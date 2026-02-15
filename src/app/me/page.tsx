'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import api from '../../lib/api';

interface Metrics {
  period: string;
  pullRequests: number;
  mergedPRs: number;
  commits: number;
  reviews: number;
  avgCycleTimeHours: number | null;
}

interface Baseline {
  teamName: string;
  teamSize: number;
  avgPullRequests: number;
  avgCommits: number;
  avgReviews: number;
}

interface Skill {
  id: string;
  skillName: string;
  category: string;
  verifiedLevel: string | null;
  confidenceScore: number;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  severity: string;
  createdAt: string;
}

interface PdiSuggestion {
  id: string;
  targetSkill: string;
  targetLevel: string;
  title: string;
  description: string;
}

export default function DeveloperArea() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [pdiSuggestions, setPdiSuggestions] = useState<PdiSuggestion[]>([]);
  const [pdiPlans, setPdiPlans] = useState<any[]>([]);
  const [pdiSelected, setPdiSelected] = useState<Set<string>>(new Set());
  const [pdiCreating, setPdiCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user?.personId) return;

    setLoading(true);
    Promise.all([
      api.get('/me/metrics').catch(() => null),
      api.get('/me/baseline').catch(() => null),
      api.get('/me/skills').catch(() => []),
      api.get('/me/insights').catch(() => []),
      api.get(`/pdi/suggestions/${user.personId}`).catch(() => []),
      api.get(`/pdi/person/${user.personId}`).catch(() => []),
    ])
      .then(([m, b, s, i, sug, plans]) => {
        setMetrics(m);
        setBaseline(b);
        setSkills(s);
        setInsights(i);
        setPdiSuggestions(Array.isArray(sug) ? sug : []);
        setPdiPlans(Array.isArray(plans) ? plans : []);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleCreatePdi = () => {
    if (!user?.personId || pdiSelected.size === 0) return;
    setPdiCreating(true);
    api
      .post('/pdi/from-suggestions', { personId: user.personId, suggestionIds: Array.from(pdiSelected) })
      .then((res: any) => {
        setPdiPlans((prev) => [...(res.plans ?? []), ...prev]);
        setPdiSuggestions((prev) => prev.filter((s) => !pdiSelected.has(s.id)));
        setPdiSelected(new Set());
      })
      .finally(() => setPdiCreating(false));
  };

  if (authLoading) {
    return <div className="text-muted py-8">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted">Faça login para acessar sua área.</p>
      </div>
    );
  }

  if (!user.personId) {
    return (
      <div className="space-y-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Minha Área</h1>
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-6 text-yellow-400">
          Sua conta ainda não está vinculada a um perfil de desenvolvedor.
          Entre em contato com o administrador.
        </div>
      </div>
    );
  }

  const dreyfusColors: Record<string, string> = {
    EXPERT: 'text-purple-400',
    PROFICIENT: 'text-blue-400',
    COMPETENT: 'text-green-400',
    ADVANCED_BEGINNER: 'text-yellow-400',
    NOVICE: 'text-muted',
  };

  const insightColors: Record<string, string> = {
    PRAISE: 'border-green-500/30 bg-green-500/5',
    GROWTH: 'border-blue-500/30 bg-blue-500/5',
    GAP: 'border-yellow-500/30 bg-yellow-500/5',
    RISK: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha Área</h1>
        <p className="mt-1 text-muted">
          Seus dados, métricas e insights pessoais.
        </p>
      </div>

      {loading ? (
        <div className="text-muted">Carregando dados...</div>
      ) : (
        <>
          {/* Metrics + Baseline */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* My metrics */}
            <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Minhas Métricas (30d)
              </h2>
              {metrics ? (
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard label="Pull Requests" value={metrics.pullRequests} />
                  <MetricCard label="PRs Mergeados" value={metrics.mergedPRs} />
                  <MetricCard label="Commits" value={metrics.commits} />
                  <MetricCard label="Code Reviews" value={metrics.reviews} />
                  {metrics.avgCycleTimeHours != null && (
                    <MetricCard
                      label="Cycle Time Médio"
                      value={`${metrics.avgCycleTimeHours}h`}
                    />
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Sem dados de métricas ainda.
                </p>
              )}
            </div>

            {/* Baseline comparison */}
            <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Baseline do Time
              </h2>
              {baseline ? (
                <>
                  <p className="text-sm text-muted">
                    Time: <span className="text-foreground-secondary">{baseline.teamName}</span>
                    {' '}({baseline.teamSize} membros)
                  </p>
                  <div className="space-y-3">
                    <ComparisonRow
                      label="PRs / membro"
                      mine={metrics?.pullRequests ?? 0}
                      teamAvg={baseline.avgPullRequests}
                    />
                    <ComparisonRow
                      label="Commits / membro"
                      mine={metrics?.commits ?? 0}
                      teamAvg={baseline.avgCommits}
                    />
                    <ComparisonRow
                      label="Reviews / membro"
                      mine={metrics?.reviews ?? 0}
                      teamAvg={baseline.avgReviews}
                    />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Sem time atribuído ou dados insuficientes.
                </p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Minhas Skills</h2>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {skills.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border-default px-4 py-2 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground-secondary">
                        {s.skillName}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.category}</span>
                    </div>
                    {s.verifiedLevel && (
                      <p
                        className={`text-xs font-medium ${dreyfusColors[s.verifiedLevel] || 'text-muted'}`}
                      >
                        {s.verifiedLevel.replace('_', ' ')}
                      </p>
                    )}
                    <div className="h-1 w-full rounded-full bg-surface-hover">
                      <div
                        className="h-1 rounded-full bg-blue-500"
                        style={{ width: `${Math.round(s.confidenceScore * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhuma skill registrada ainda.
              </p>
            )}
          </div>

          {/* PDI suggestions */}
          {(pdiSuggestions.length > 0 || pdiPlans.length > 0) && (
            <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">PDI — Plano de Desenvolvimento</h2>
              {pdiSuggestions.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Sugestões com base em gaps de skills (Dreyfus) e cargo. Selecione e crie os planos.
                  </p>
                  <ul className="space-y-2">
                    {pdiSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 rounded-lg border border-border-default p-3"
                      >
                        <input
                          type="checkbox"
                          checked={pdiSelected.has(s.id)}
                          onChange={(e) => {
                            setPdiSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(s.id);
                              else next.delete(s.id);
                              return next;
                            });
                          }}
                          className="rounded border-border-default"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground-secondary">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.targetSkill} → {s.targetLevel}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleCreatePdi}
                    disabled={pdiSelected.size === 0 || pdiCreating}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {pdiCreating ? 'Criando...' : `Criar ${pdiSelected.size > 0 ? pdiSelected.size : ''} plano(s)`}
                  </button>
                </>
              )}
              {pdiPlans.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border-default">
                  <p className="text-sm font-medium text-foreground-secondary mb-2">Seus planos ativos</p>
                  <ul className="space-y-2">
                    {pdiPlans.slice(0, 5).map((p: any) => (
                      <li key={p.id} className="text-sm text-muted-foreground">
                        {p.title} {p.targetSkill && `(${p.targetSkill} → ${p.targetLevel || ''})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Insights</h2>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((i) => (
                  <div
                    key={i.id}
                    className={`rounded-lg border p-4 ${insightColors[i.type] || 'border-border-default bg-surface-hover/50'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase text-muted">
                        {i.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(i.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground-secondary">
                      {i.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{i.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum insight gerado ainda.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  mine,
  teamAvg,
}: {
  label: string;
  mine: number;
  teamAvg: number;
}) {
  const diff = teamAvg > 0 ? Math.round(((mine - teamAvg) / teamAvg) * 100) : 0;
  const isAbove = diff > 0;
  const isBelow = diff < -10;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-foreground-secondary font-medium">{mine}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="text-muted">{teamAvg}</span>
        <span
          className={`text-xs font-medium ${
            isAbove ? 'text-green-400' : isBelow ? 'text-red-400' : 'text-muted-foreground'
          }`}
        >
          {diff > 0 ? '+' : ''}
          {diff}%
        </span>
      </div>
    </div>
  );
}
