import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface ScatterChartCardProps {
  title: string;
  data: Record<string, any>[];
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  loading?: boolean;
  height?: number;
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-default bg-surface px-3 py-2 shadow-lg">
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-foreground-secondary">
          <span className="font-semibold text-foreground">{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
}

export function ScatterChartCard({
  title,
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  color = '#3b82f6',
  loading,
  height = 260,
}: ScatterChartCardProps) {
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
        <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xLabel || xKey}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yLabel || yKey}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[30, 30]} />
          <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill={color} fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
