'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface AreaChartCardProps {
  title: string;
  data: Record<string, any>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  unit?: string;
  loading?: boolean;
  height?: number;
}

function ChartTooltip({ active, payload, label, unit, title }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-default bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-foreground-secondary">
          {entry.value}{unit ? ` ${unit}` : ''}
        </p>
      ))}
    </div>
  );
}

export function AreaChartCard({
  title,
  data,
  dataKey,
  xKey = 'label',
  color = '#3b82f6',
  unit,
  loading,
  height = 200,
}: AreaChartCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-5 animate-pulse">
        <div className="h-3 w-32 rounded bg-surface-hover mb-4" />
        <div className="rounded bg-surface-hover" style={{ height }} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface p-5">
      <p className="mb-4 text-sm font-medium text-foreground-secondary">{title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip unit={unit} title={title} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
