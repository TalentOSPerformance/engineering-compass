'use client';

interface TrendData {
  period: string;
  value: number;
}

interface MetricTrendProps {
  title: string;
  unit: string;
  data: TrendData[];
  target?: number;
}

export function MetricTrend({ title, unit, data, target }: MetricTrendProps) {
  const maxValue = Math.max(...data.map((d) => d.value), target || 0);
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;
  const latestValue = data[data.length - 1]?.value || 0;

  return (
    <div className="rounded-xl border border-border-default bg-surface p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold">
            {latestValue} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </p>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="mt-6 flex items-end gap-2" style={{ height: '120px' }}>
        {data.map((d, i) => {
          const heightPct = ((d.value - minValue * 0.8) / (maxValue - minValue * 0.8)) * 100;
          const isLatest = i === data.length - 1;

          return (
            <div key={d.period} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">{d.value}</span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    isLatest ? 'bg-blue-500' : 'bg-surface-active'
                  }`}
                  style={{ height: `${Math.max(heightPct, 5)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{d.period}</span>
            </div>
          );
        })}
      </div>

      {/* Target line indicator */}
      {target && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-emerald-500/50" />
          <span className="text-xs text-emerald-500">Target: {target} {unit}</span>
        </div>
      )}
    </div>
  );
}
