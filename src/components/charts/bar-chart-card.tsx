'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { HelpCircle } from 'lucide-react';

export interface BarChartCardProps {
  title: string;
  /** Short explanation shown below the title. */
  description?: string;
  /** Tooltip text for the info icon (e.g. "Para que serve e por que importa"). */
  tooltip?: string;
  data: Record<string, any>[];
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  unit?: string;
  loading?: boolean;
  height?: number;
  layout?: 'vertical' | 'horizontal';
}

const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

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

export function BarChartCard({
  title,
  description,
  tooltip,
  data,
  dataKey,
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  unit,
  loading,
  height = 200,
  layout = 'horizontal',
}: BarChartCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-5 animate-pulse">
        <div className="h-3 w-32 rounded bg-surface-hover mb-4" />
        <div className="rounded bg-surface-hover" style={{ height }} />
      </div>
    );
  }

  const isVertical = layout === 'vertical';

  return (
    <div className="rounded-xl border border-border-default bg-surface p-5">
      <div className="mb-4 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground-secondary">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {tooltip && (
          <span
            className="flex-shrink-0 rounded-full text-muted-foreground hover:text-foreground-secondary transition-colors cursor-help"
            title={tooltip}
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 4, bottom: 0, left: isVertical ? 60 : -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip content={<ChartTooltip unit={unit} title={title} />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
