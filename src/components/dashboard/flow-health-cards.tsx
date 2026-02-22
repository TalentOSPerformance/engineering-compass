import { motion } from 'framer-motion';

interface FlowHealth {
  cycleTimeP85: number;
  prPickupTimeAvg: number;
  silentPrRate: number;
  reviewDepthAvg: number;
}

function classifyFlow(metric: string, value: number): 'elite' | 'high' | 'low' {
  switch (metric) {
    case 'cycleTime':
      return value <= 48 ? 'elite' : value <= 168 ? 'high' : 'low';
    case 'pickupTime':
      return value <= 4 ? 'elite' : value <= 24 ? 'high' : 'low';
    case 'silentRate':
      return value <= 0.01 ? 'elite' : value <= 0.05 ? 'high' : 'low';
    case 'reviewDepth':
      return value >= 2 ? 'elite' : value >= 1 ? 'high' : 'low';
    default:
      return 'high';
  }
}

const STATUS_STYLES = {
  elite: { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Healthy', accent: 'rgb(var(--perf-elite))' },
  high: { bar: 'bg-amber-500', text: 'text-amber-400', label: 'Attention', accent: 'rgb(var(--perf-medium))' },
  low: { bar: 'bg-red-500', text: 'text-red-400', label: 'Risk', accent: 'rgb(var(--perf-low))' },
};

export function FlowHealthCards({ flow }: { flow: FlowHealth }) {
  const metrics = [
    {
      label: 'Cycle Time (P85)',
      value: `${flow.cycleTimeP85}h`,
      description: 'PR open to merge (85th percentile)',
      level: classifyFlow('cycleTime', flow.cycleTimeP85),
      barPct: Math.min(100, (flow.cycleTimeP85 / 168) * 100),
    },
    {
      label: 'PR Pickup Time',
      value: `${flow.prPickupTimeAvg}h`,
      description: 'Average time to first review',
      level: classifyFlow('pickupTime', flow.prPickupTimeAvg),
      barPct: Math.min(100, (flow.prPickupTimeAvg / 24) * 100),
    },
    {
      label: 'Silent PR Rate',
      value: `${Math.round(flow.silentPrRate * 100)}%`,
      description: 'PRs merged without review',
      level: classifyFlow('silentRate', flow.silentPrRate),
      barPct: Math.min(100, flow.silentPrRate * 100 * 10),
    },
    {
      label: 'Review Depth',
      value: `${flow.reviewDepthAvg}`,
      description: 'Average comments per PR',
      level: classifyFlow('reviewDepth', flow.reviewDepthAvg),
      barPct: Math.min(100, (flow.reviewDepthAvg / 5) * 100),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m, i) => {
        const style = STATUS_STYLES[m.level];
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-md border border-border-default bg-surface p-5 card-hover overflow-hidden"
          >
            {/* Left accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: style.accent, opacity: 0.5 }}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground-secondary">{m.label}</p>
              <span className={`text-xs font-medium ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold font-mono">{m.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            <div className="mt-3 h-1 w-full rounded-sm bg-surface-hover overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.barPct}%` }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.06, ease: 'easeOut' }}
                className={`h-1 rounded-sm ${style.bar}`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
