import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const TYPE_STYLES: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  PRAISE: { icon: '🏆', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  GAP: { icon: '📉', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
  RISK: { icon: '⚠️', bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400' },
  GROWTH: { icon: '🌱', bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
};

type Insight = {
  id: string;
  type: string;
  title: string;
  content: string;
  relatedSkills: string[];
  severity: string;
  status: string;
  createdAt: string;
};

function formatDate(d: string | Date): string {
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
}

export default function InsightsPage() {
  const { user } = useAuth();
  const personId = user?.personId;
  const [insights, setInsights] = useState<Insight[]>([]);
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
      .get<Insight[]>(`/insights/person/${personId}`)
      .then((data) => setInsights(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [personId]);

  const acknowledge = (insightId: string) => {
    api
      .patch(`/insights/${insightId}/status`, { status: 'ACKNOWLEDGED' })
      .then(() => setInsights((prev) => prev.map((i) => (i.id === insightId ? { ...i, status: 'ACKNOWLEDGED' } : i))))
      .catch(() => {});
  };

  if (!personId) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted">Your profile is not linked to a person record.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const relatedSkills = (insight: Insight): string[] =>
    Array.isArray(insight.relatedSkills) ? insight.relatedSkills : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="mt-1 text-sm text-muted">
          Personalized recommendations based on your code evidence
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(['PRAISE', 'GAP', 'RISK', 'GROWTH'] as const).map((type) => {
          const count = insights.filter((i) => i.type === type).length;
          const style = TYPE_STYLES[type];
          return (
            <div key={type} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
              <span className="text-2xl">{style.icon}</span>
              <p className={`mt-2 text-2xl font-bold ${style.text}`}>{count}</p>
              <p className="text-xs text-muted capitalize">{type.toLowerCase()}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = TYPE_STYLES[insight.type] ?? TYPE_STYLES.PRAISE;
          return (
            <div
              key={insight.id}
              className={`rounded-xl border ${style.border} ${style.bg} p-5 transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{style.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{insight.title}</p>
                    <p className="mt-1 text-sm text-muted leading-relaxed">{insight.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {relatedSkills(insight).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-foreground-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(insight.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {insight.status === 'ACKNOWLEDGED' && (
                    <span className="text-xs text-muted-foreground">Acknowledged</span>
                  )}
                  {insight.status === 'NEW' && (
                    <button
                      onClick={() => acknowledge(insight.id)}
                      className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-foreground-secondary hover:bg-surface-active transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
