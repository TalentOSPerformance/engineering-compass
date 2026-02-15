'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SparklineCardProps {
  title: string;
  value: string;
  unit: string;
  /** Optional sparkline data — if empty/null, no chart is shown */
  data?: { v: number }[];
  color?: string;
  delay?: number;
  /** Optional secondary text below the unit */
  secondary?: string;
}

function MiniTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border-default bg-surface px-2 py-1 text-[10px] font-mono text-foreground shadow-sm">
      {payload[0].value}
    </div>
  );
}

export function SparklineCard({ title, value, unit, data, color = 'rgb(var(--perf-high))', delay = 0, secondary }: SparklineCardProps) {
  const gradientId = `spark-${title.replace(/\s/g, '')}`;
  const hasData = data && data.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.06 }}
      className="rounded-xl border border-border-default bg-surface p-4 flex flex-col justify-between"
    >
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-xl font-semibold font-mono tracking-tight text-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      {secondary && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{secondary}</p>
      )}
      {hasData && (
        <div className="mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<MiniTooltip />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
