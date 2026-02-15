import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import api from '@/lib/api';

interface MentoringSuggestion {
  expertId: string;
  expertName: string;
  noviceId: string;
  noviceName: string;
  skills: string[];
}

export default function MentoringPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { teamId } = useFilters();
  const [suggestions, setSuggestions] = useState<MentoringSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);
    api
      .get<MentoringSuggestion[]>(`/marketplace/${orgId}/mentoring-suggestions?${params}`)
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch((err: Error) => {
        setError(err.message);
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
  }, [orgId, teamId]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mentoria</h1>
        <p className="text-muted-foreground">Selecione uma organização.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mentoria</h1>
        <div className="h-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mentoria</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentoria inteligente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sugestões de pares mentor (Expert/Proficiente) e mentorado (Novato/Iniciante) por skill na organização.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-muted-foreground">
            Nenhuma sugestão de mentoria no momento. Verifique se há skills verificadas (Dreyfus) para Expert/Proficiente e Novato/Iniciante na mesma skill.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s, i) => (
              <div
                key={`${s.expertId}-${s.noviceId}-${i}`}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">{s.expertName}</p>
                    <p className="text-xs text-muted-foreground">Mentor</p>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="text-right">
                    <p className="font-medium">{s.noviceName}</p>
                    <p className="text-xs text-muted-foreground">Mentorado</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{s.skills.length} skill(s) em comum</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
