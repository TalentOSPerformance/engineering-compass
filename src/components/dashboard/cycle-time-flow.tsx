'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export interface CycleStage {
  label: string;
  hours: number;
  level: 'elite' | 'high' | 'medium' | 'low';
}

export interface CycleTimeFlowProps {
  /** Total P85 cycle time in hours */
  totalHours: number;
  /** Individual stage breakdown — pass null/undefined if no breakdown data */
  stages: CycleStage[] | null;
  /** Trend percentage vs previous period (positive = improvement) */
  trendPct?: number;
  /** Optional className for the outer container */
  className?: string;
}

const levelBarStyle: Record<string, string> = {
  elite: 'rgb(var(--perf-elite))',
  high: 'rgb(var(--perf-high))',
  medium: 'rgb(var(--perf-medium))',
  low: 'rgb(var(--perf-low))',
};

const levelTextStyle: Record<string, string> = {
  elite: 'rgb(var(--perf-elite))',
  high: 'rgb(var(--perf-high))',
  medium: 'rgb(var(--perf-medium))',
  low: 'rgb(var(--perf-low))',
};

function formatHoursShort(hours: number): string {
  if (!hours || hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function classifyStageLevel(label: string, hours: number): 'elite' | 'high' | 'medium' | 'low' {
  // Thresholds vary by stage type
  if (label === 'Coding') {
    if (hours <= 4) return 'elite';
    if (hours <= 12) return 'high';
    if (hours <= 24) return 'medium';
    return 'low';
  }
  if (label === 'Pickup') {
    if (hours <= 1) return 'elite';
    if (hours <= 4) return 'high';
    if (hours <= 8) return 'medium';
    return 'low';
  }
  if (label === 'Review') {
    if (hours <= 2) return 'elite';
    if (hours <= 8) return 'high';
    if (hours <= 16) return 'medium';
    return 'low';
  }
  // Deploy
  if (hours <= 0.5) return 'elite';
  if (hours <= 2) return 'high';
  if (hours <= 6) return 'medium';
  return 'low';
}

export function CycleTimeFlow({ totalHours, stages, trendPct, className }: CycleTimeFlowProps) {
  const hasStages = stages != null && stages.length > 0;
  const stageTotal = hasStages ? stages!.reduce((sum, s) => sum + s.hours, 0) : 0;
  const bottleneck = hasStages
    ? stages!.reduce((max, s) => (s.hours > max.hours ? s : max), stages![0])
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={cn(
        'rounded-xl border border-border-default bg-surface p-5',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Cycle Time</h3>
        {trendPct != null && trendPct !== 0 && (
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: trendPct > 0 ? levelBarStyle.elite : levelBarStyle.low }}
          >
            {trendPct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trendPct > 0 ? '-' : '+'}{Math.abs(trendPct)}% vs previous</span>
          </div>
        )}
      </div>

      {/* Total Value */}
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
          {totalHours > 0 ? totalHours.toFixed(1) : '—'}
        </span>
        <span className="text-sm text-muted-foreground">hours</span>
        <span className="text-xs text-muted-foreground ml-1">P85 Cycle Time</span>
      </div>

      {/* Pipeline Flow */}
      {hasStages && stageTotal > 0 ? (
        <>
          <div className="flex items-stretch gap-0">
            {stages!.map((stage, i) => {
              const widthPct = Math.max((stage.hours / stageTotal) * 100, 12);
              const isBottleneck = stage === bottleneck;
              return (
                <div
                  key={stage.label}
                  className="flex items-center"
                  style={{ width: `${widthPct}%`, minWidth: 0 }}
                >
                  <div className="flex-1 min-w-0">
                    {/* Bar */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                      className={cn(
                        'h-3 origin-left relative',
                        i === 0 && 'rounded-l-full',
                        i === stages!.length - 1 && 'rounded-r-full',
                      )}
                      style={{ backgroundColor: levelBarStyle[stage.level], opacity: 0.85 }}
                    />
                    {/* Label */}
                    <div className="mt-2 px-0.5">
                      <p
                        className="text-sm font-semibold font-mono"
                        style={{ color: levelTextStyle[stage.level] }}
                      >
                        {formatHoursShort(stage.hours)}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {stage.label}
                        {isBottleneck && <AlertTriangle className="h-2.5 w-2.5" style={{ color: levelBarStyle.medium }} />}
                      </p>
                    </div>
                  </div>
                  {i < stages!.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 mx-1 mt-[-14px]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottleneck hint */}
          {bottleneck && (
            <div
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md"
              style={{
                backgroundColor: 'rgb(var(--perf-medium) / 0.08)',
                borderWidth: 1,
                borderColor: 'rgb(var(--perf-medium) / 0.15)',
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: levelBarStyle.medium }} />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{bottleneck.label}</span> e o maior gargalo.
                Considere revisar o processo para reduzir o tempo.
              </span>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Execute um backfill para ver o breakdown detalhado do cycle time.
        </p>
      )}
    </motion.div>
  );
}

/** Helper to build CycleStage[] from breakdown API data */
export function buildStagesFromBreakdown(breakdown: {
  codingTimeP75: number;
  pickupTimeP75: number;
  reviewTimeP75: number;
  deployTimeP75: number;
}): CycleStage[] {
  return [
    {
      label: 'Coding',
      hours: breakdown.codingTimeP75,
      level: classifyStageLevel('Coding', breakdown.codingTimeP75),
    },
    {
      label: 'Pickup',
      hours: breakdown.pickupTimeP75,
      level: classifyStageLevel('Pickup', breakdown.pickupTimeP75),
    },
    {
      label: 'Review',
      hours: breakdown.reviewTimeP75,
      level: classifyStageLevel('Review', breakdown.reviewTimeP75),
    },
    {
      label: 'Deploy',
      hours: breakdown.deployTimeP75,
      level: classifyStageLevel('Deploy', breakdown.deployTimeP75),
    },
  ];
}
