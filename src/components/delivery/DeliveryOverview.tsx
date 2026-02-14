import { MetricCard } from "@/components/dashboard/MetricCard";
import { FlowHealthCards } from "@/components/dashboard/FlowHealthCards";
import { MetricTrend } from "@/components/dashboard/MetricTrend";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { HelpCircle } from "lucide-react";

const cycleTimeBreakdown = [
  { title: "Coding Time", value: "8.2", unit: "hours", level: "high" as const, trend: "up" as const, trendValue: "-5%" },
  { title: "Pickup Time", value: "3.2", unit: "hours", level: "medium" as const, trend: "down" as const, trendValue: "+12%" },
  { title: "Review Time", value: "4.1", unit: "hours", level: "high" as const, trend: "up" as const, trendValue: "-8%" },
  { title: "CI Time", value: "1.8", unit: "hours", level: "elite" as const, trend: "up" as const, trendValue: "-3%" },
  { title: "Total Cycle Time", value: "18.4", unit: "hours", level: "high" as const, trend: "up" as const, trendValue: "-10%" },
  { title: "Deploy Frequency", value: "4.2", unit: "deploys/day", level: "elite" as const, trend: "up" as const, trendValue: "+15%" },
];

const reviewDistribution = [
  { name: "Ana Silva", reviews: 42 },
  { name: "Carlos Lima", reviews: 38 },
  { name: "Bruna Costa", reviews: 31 },
  { name: "João Pedro", reviews: 28 },
  { name: "Maria Souza", reviews: 24 },
  { name: "Lucas Alves", reviews: 19 },
  { name: "Fernanda Reis", reviews: 15 },
  { name: "Pedro Santos", reviews: 12 },
];

const trendData = {
  cycleTime: [
    { label: "W1", value: 24 }, { label: "W2", value: 22 }, { label: "W3", value: 20 },
    { label: "W4", value: 21 }, { label: "W5", value: 19 }, { label: "W6", value: 18 },
    { label: "W7", value: 19 }, { label: "W8", value: 18 },
  ],
  pickupTime: [
    { label: "W1", value: 4.8 }, { label: "W2", value: 4.5 }, { label: "W3", value: 4.0 },
    { label: "W4", value: 3.8 }, { label: "W5", value: 3.6 }, { label: "W6", value: 3.4 },
    { label: "W7", value: 3.3 }, { label: "W8", value: 3.2 },
  ],
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} reviews
      </p>
    </div>
  );
};

export function DeliveryOverview() {
  return (
    <div className="space-y-6">
      {/* Cycle Time Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Cycle Time Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cycleTimeBreakdown.map((m, i) => (
            <MetricCard key={m.title} {...m} delay={i} />
          ))}
        </div>
      </div>

      {/* Flow Health */}
      <FlowHealthCards />

      {/* Review Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-foreground">Review Distribution</h2>
          <div className="group relative">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md z-10">
              Distribuição de reviews por autor — quantos PRs cada revisor avaliou no período selecionado.
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reviewDistribution} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar dataKey="reviews" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Trends */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Trends</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricTrend title="Cycle Time" data={trendData.cycleTime} target={20} delay={12} />
          <MetricTrend title="PR Pickup Time" data={trendData.pickupTime} color="bg-chart-5" delay={13} />
        </div>
      </div>
    </div>
  );
}
