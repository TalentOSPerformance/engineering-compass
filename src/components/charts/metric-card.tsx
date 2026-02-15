'use client';

import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  level?: 'elite' | 'high' | 'medium' | 'low' | string;
  trendPct?: number;
  sparklineData?: { value: number }[];
  loading?: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  elite: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  high: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  low: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
};

export function MetricCard({
  title,
  value,
  unit,
  level,
  trendPct,
  sparklineData,
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-5 animate-pulse">
        <div className="h-3 w-24 rounded bg-surface-hover mb-3" />
        <div className="h-8 w-16 rounded bg-surface-hover mb-2" />
        <div className="h-3 w-20 rounded bg-surface-hover" />
      </div>
    );
  }

  const levelStyle = level ? LEVEL_COLORS[level] || LEVEL_COLORS.medium : null;

  return (
    <div className="rounded-xl border border-border-default bg-surface p-5 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {levelStyle && (
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${levelStyle.dot}`} />
        )}
      </div>

      <div className="mt-2 flex items-end gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {trendPct != null && trendPct !== 0 && (
            <span
              className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium ${
                trendPct > 0 ? 'text-emerald-500' : 'text-red-400'
              }`}
            >
              {trendPct > 0 ? '↑' : '↓'} {Math.abs(trendPct)}%
            </span>
          )}
          {levelStyle && level && (
            <span className={`mt-1 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${levelStyle.bg} ${levelStyle.text}`}>
              {level}
            </span>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="h-10 w-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="rgb(59,130,246)"
                  strokeWidth={1.5}
                  fill="url(#sparkGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
