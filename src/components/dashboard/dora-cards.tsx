import { motion } from 'framer-motion';
import { Rocket, Clock, ShieldCheck, Wrench } from 'lucide-react';

interface MetricValue {
  value: number;
  unit: string;
  level: 'elite' | 'high' | 'medium' | 'low';
  trendPct: number;
}

interface DORAMetrics {
  deploymentFrequency: MetricValue;
  leadTimeForChanges: MetricValue;
  changeFailureRate: MetricValue;
  timeToRestore: MetricValue;
}

const LEVEL_COLORS = {
  elite: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  high: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  low: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const LEVEL_DOT = {
  elite: 'bg-emerald-400',
  high: 'bg-blue-400',
  medium: 'bg-amber-400',
  low: 'bg-red-400',
};

const LEVEL_ACCENT = {
  elite: 'rgb(var(--perf-elite))',
  high: 'rgb(var(--perf-high))',
  medium: 'rgb(var(--perf-medium))',
  low: 'rgb(var(--perf-low))',
};

function formatValue(metric: MetricValue): { main: string; unit: string } {
  switch (metric.unit) {
    case 'deploys_per_day':
      return { main: `${metric.value}`, unit: 'deploys/day' };
    case 'hours':
      return metric.value < 1
        ? { main: `${Math.round(metric.value * 60)}`, unit: 'min' }
        : { main: `${metric.value}`, unit: 'hours' };
    case 'ratio':
      return { main: `${Math.round(metric.value * 100)}`, unit: '%' };
    default:
      return { main: `${metric.value}`, unit: '' };
  }
}

function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-xs text-muted-foreground">--</span>;
  const isPositive = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? '↗' : '↘'} {isPositive ? '+' : ''}{pct}%
    </span>
  );
}

export function DORACards({ metrics }: { metrics: DORAMetrics }) {
  const cards = [
    { label: 'Deployment Frequency', metric: metrics.deploymentFrequency, icon: Rocket },
    { label: 'Lead Time for Changes', metric: metrics.leadTimeForChanges, icon: Clock },
    { label: 'Change Failure Rate', metric: metrics.changeFailureRate, icon: ShieldCheck },
    { label: 'Time to Restore', metric: metrics.timeToRestore, icon: Wrench },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => {
        const formatted = formatValue(card.metric);
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-md border border-border-default bg-surface p-5 card-hover card-accent overflow-hidden"
            style={{ '--accent-color': LEVEL_ACCENT[card.metric.level] } as React.CSSProperties}
          >
            {/* Colored left accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] transition-opacity duration-200 group-hover:opacity-100"
              style={{ backgroundColor: LEVEL_ACCENT[card.metric.level], opacity: 0.6 }}
            />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground opacity-50 group-hover:opacity-80 transition-opacity">
                <Icon size={18} />
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium capitalize ${LEVEL_COLORS[card.metric.level]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[card.metric.level]}`} />
                {card.metric.level}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                  {formatted.main}
                </span>
                <span className="text-sm text-muted-foreground">{formatted.unit}</span>
              </div>
              <div className="mt-1.5">
                <TrendBadge pct={card.metric.trendPct} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
