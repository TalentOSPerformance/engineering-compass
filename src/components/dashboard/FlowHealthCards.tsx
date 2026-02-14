import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type FlowLevel = "healthy" | "needs-attention" | "at-risk";

interface FlowMetric {
  title: string;
  value: number;
  max: number;
  unit: string;
  level: FlowLevel;
  displayValue: string;
}

const flowLevelColor: Record<FlowLevel, string> = {
  healthy: "bg-perf-elite",
  "needs-attention": "bg-perf-medium",
  "at-risk": "bg-perf-low",
};

const flowLevelLabel: Record<FlowLevel, { text: string; className: string }> = {
  healthy: { text: "Healthy", className: "text-perf-elite" },
  "needs-attention": { text: "Needs Attention", className: "text-perf-medium" },
  "at-risk": { text: "At Risk", className: "text-perf-low" },
};

const flowMetrics: FlowMetric[] = [
  { title: "Cycle Time", value: 65, max: 100, unit: "hours", level: "healthy", displayValue: "18.4" },
  { title: "PR Pickup Time", value: 45, max: 100, unit: "hours", level: "needs-attention", displayValue: "4.2" },
  { title: "Silent PR Rate", value: 20, max: 100, unit: "%", level: "healthy", displayValue: "8.5" },
  { title: "Review Depth", value: 80, max: 100, unit: "comments/PR", level: "healthy", displayValue: "3.1" },
];

export function FlowHealthCards() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Flow Health</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {flowMetrics.map((m, i) => {
          const pct = Math.min((m.value / m.max) * 100, 100);
          const info = flowLevelLabel[m.level];
          return (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: (i + 9) * 0.06 }}
              className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{m.title}</span>
                <span className={cn("text-[10px] font-semibold", info.className)}>{info.text}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold font-mono tracking-tight text-card-foreground">
                  {m.displayValue}
                </span>
                <span className="text-xs text-muted-foreground">{m.unit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: (i + 9) * 0.06 + 0.2, ease: "easeOut" }}
                  className={cn("h-full rounded-full", flowLevelColor[m.level])}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
