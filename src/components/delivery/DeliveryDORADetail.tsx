import { MetricCard } from "@/components/dashboard/MetricCard";
import { MetricTrend } from "@/components/dashboard/MetricTrend";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const doraMetrics = [
  { title: "Deployment Frequency", value: "4.2", unit: "deploys/day", level: "elite" as const, trend: "up" as const, trendValue: "+12%" },
  { title: "Lead Time for Changes", value: "2.1", unit: "hours", level: "high" as const, trend: "down" as const, trendValue: "-8%" },
  { title: "Change Failure Rate", value: "3.2", unit: "%", level: "elite" as const, trend: "up" as const, trendValue: "-1.5%" },
  { title: "Time to Restore", value: "0.8", unit: "hours", level: "elite" as const, trend: "up" as const, trendValue: "-15%" },
];

const deployFreqTrend = [
  { date: "Jan 6", value: 3.1 }, { date: "Jan 13", value: 3.4 }, { date: "Jan 20", value: 3.6 },
  { date: "Jan 27", value: 3.8 }, { date: "Feb 3", value: 4.0 }, { date: "Feb 10", value: 4.1 },
  { date: "Feb 17", value: 3.9 }, { date: "Feb 24", value: 4.2 },
];

const leadTimeTrend = [
  { date: "Jan 6", value: 3.2 }, { date: "Jan 13", value: 2.9 }, { date: "Jan 20", value: 2.7 },
  { date: "Jan 27", value: 2.5 }, { date: "Feb 3", value: 2.3 }, { date: "Feb 10", value: 2.2 },
  { date: "Feb 17", value: 2.4 }, { date: "Feb 24", value: 2.1 },
];

const cfrTrend = [
  { date: "Jan 6", value: 5.1 }, { date: "Jan 13", value: 4.8 }, { date: "Jan 20", value: 4.3 },
  { date: "Jan 27", value: 4.0 }, { date: "Feb 3", value: 3.8 }, { date: "Feb 10", value: 3.5 },
  { date: "Feb 17", value: 3.3 }, { date: "Feb 24", value: 3.2 },
];

const mttrTrend = [
  { date: "Jan 6", value: 1.8 }, { date: "Jan 13", value: 1.5 }, { date: "Jan 20", value: 1.3 },
  { date: "Jan 27", value: 1.1 }, { date: "Feb 3", value: 1.0 }, { date: "Feb 10", value: 0.9 },
  { date: "Feb 17", value: 1.0 }, { date: "Feb 24", value: 0.8 },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value}</p>
    </div>
  );
};

interface AreaChartCardProps {
  title: string;
  data: { date: string; value: number }[];
  color: string;
  unit: string;
  delay: number;
}

function AreaChartCard({ title, data, color, unit, delay }: AreaChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.08 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <h3 className="text-xs font-medium text-muted-foreground mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${title.replace(/\s/g, "")})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function DeliveryDORADetail() {
  return (
    <div className="space-y-6">
      {/* DORA Cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">DORA Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {doraMetrics.map((m, i) => (
            <MetricCard key={m.title} {...m} delay={i} />
          ))}
        </div>
      </div>

      {/* DORA Trends */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">DORA Trends</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AreaChartCard title="Deployment Frequency (deploys/day)" data={deployFreqTrend} color="hsl(var(--perf-elite))" unit="deploys/day" delay={4} />
          <AreaChartCard title="Lead Time for Changes (hours)" data={leadTimeTrend} color="hsl(var(--perf-high))" unit="hours" delay={5} />
          <AreaChartCard title="Change Failure Rate (%)" data={cfrTrend} color="hsl(var(--perf-medium))" unit="%" delay={6} />
          <AreaChartCard title="Time to Restore (hours)" data={mttrTrend} color="hsl(var(--chart-5))" unit="hours" delay={7} />
        </div>
      </div>

      {/* Benchmarks */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.7 }}
        className="rounded-lg border border-border bg-card overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground">DORA Benchmarks (2024 State of DevOps)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Metric</th>
                <th className="text-center px-4 py-2.5 font-medium text-perf-elite">Elite</th>
                <th className="text-center px-4 py-2.5 font-medium text-perf-high">High</th>
                <th className="text-center px-4 py-2.5 font-medium text-perf-medium">Medium</th>
                <th className="text-center px-4 py-2.5 font-medium text-perf-low">Low</th>
                <th className="text-center px-4 py-2.5 font-medium text-primary">Your Team</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: "Deploy Frequency", elite: "Multiple/day", high: "1/week–1/month", medium: "1/month–6/months", low: "<1/6 months", yours: "4.2/day", level: "elite" },
                { metric: "Lead Time", elite: "<1 hour", high: "1 day–1 week", medium: "1 week–1 month", low: ">6 months", yours: "2.1h", level: "high" },
                { metric: "CFR", elite: "0–15%", high: "16–30%", medium: "16–30%", low: "46–60%", yours: "3.2%", level: "elite" },
                { metric: "MTTR", elite: "<1 hour", high: "<1 day", medium: "<1 day", low: "1 week–1 month", yours: "0.8h", level: "elite" },
              ].map((row) => (
                <tr key={row.metric} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-card-foreground">{row.metric}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.elite}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.high}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.medium}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.low}</td>
                  <td className="px-4 py-2.5 text-center font-mono font-semibold text-primary">{row.yours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
