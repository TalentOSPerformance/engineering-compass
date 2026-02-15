import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { SkillRadar } from '@/components/proficiency/skill-radar';
import { SkillList } from '@/components/proficiency/skill-list';

function formatDate(d: string | Date | null): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export default function ProficiencyPage() {
  const { user } = useAuth();
  const personId = user?.personId;
  const [data, setData] = useState<{ skills: Array<{
    name: string;
    category: string | null;
    declared: number | null;
    verified: number | null;
    verifiedLevel: string | null;
    confidence: number;
    decayFactor: number;
    effectiveScore: number | null;
    lastEvidence: string | Date | null;
    evidenceCount: number;
  }> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<{ skills: any[] }>(`/proficiency/person/${personId}/graph`)
      .then((res) => setData(res))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [personId]);

  const skills = (data?.skills ?? []).map((s) => ({
    ...s,
    category: s.category ?? '',
    lastEvidence: formatDate(s.lastEvidence),
  }));

  if (!personId) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Skill Proficiency</h1>
        <p className="text-muted">Your profile is not linked to a person record.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Skill Proficiency</h1>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Skill Proficiency</h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Skill Proficiency</h1>
        <p className="mt-1 text-sm text-muted">
          Declared vs. verified skills based on code evidence (Dreyfus Model)
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">
          Proficiency Radar
        </h2>
        <SkillRadar skills={skills} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">
          All Skills
        </h2>
        <SkillList skills={skills} />
      </section>
    </div>
  );
}
