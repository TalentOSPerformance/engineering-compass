import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const workData = [
  { name: "Code Changes", value: 258, color: "hsl(var(--primary))" },
  { name: "Reviews", value: 124, color: "hsl(var(--perf-elite))" },
  { name: "CI/CD", value: 86, color: "hsl(var(--perf-medium))" },
  { name: "Docs", value: 32, color: "hsl(var(--chart-5))" },
];

const WBTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-popover-foreground">{d.name}</p>
      <p className="text-muted-foreground font-mono">{d.value} items</p>
    </div>
  );
};

export function WorkBreakdownCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl bg-card p-5 card-hover border border-border/60"
    >
      <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Work Breakdown</h3>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 flex-shrink-0">
          <PieChart width={96} height={96}>
            <Pie
              data={workData}
              cx={48}
              cy={48}
              innerRadius={26}
              outerRadius={44}
              dataKey="value"
              stroke="none"
              cornerRadius={3}
            >
              {workData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<WBTooltip />} />
          </PieChart>
        </div>
        <div className="space-y-2 flex-1">
          {workData.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground font-medium">{d.name}</span>
              </div>
              <span className="font-mono font-bold text-card-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
