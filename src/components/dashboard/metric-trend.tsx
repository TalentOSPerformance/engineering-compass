import { motion } from 'framer-motion';

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
  const latestValue = data[data.length - 1]?.value || 0;

  return (
    <div className="group relative rounded-md border border-border-default bg-surface p-5 card-hover overflow-hidden">
      {/* Subtle left accent on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent opacity-0 group-hover:opacity-60 transition-opacity duration-200" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground-secondary">{title}</p>
          <p className="mt-1 text-2xl font-bold font-mono">
            {latestValue} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="mt-5 flex items-end gap-1.5" style={{ height: '100px' }}>
        {data.map((d, i) => {
          const heightPct = ((d.value - minValue * 0.8) / (maxValue - minValue * 0.8)) * 100;
          const isLatest = i === data.length - 1;

          return (
            <div key={d.period} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground font-mono">{d.value}</span>
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 5)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full rounded-sm ${
                    isLatest ? 'bg-accent' : 'bg-surface-active'
                  }`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.period}</span>
            </div>
          );
        })}
      </div>

      {target && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-emerald-500/40" />
          <span className="text-[10px] text-emerald-500 font-mono">Target: {target} {unit}</span>
        </div>
      )}
    </div>
  );
}
