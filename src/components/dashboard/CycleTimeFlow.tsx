import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";

interface CycleStage {
  label: string;
  value: string;
  hours: number;
  maxHours: number;
  level: "elite" | "high" | "medium" | "low";
}

const stages: CycleStage[] = [
  { label: "Coding", value: "8h 12m", hours: 8.2, maxHours: 48, level: "high" },
  { label: "Pickup", value: "3h 12m", hours: 3.2, maxHours: 48, level: "medium" },
  { label: "Review", value: "4h 06m", hours: 4.1, maxHours: 48, level: "high" },
  { label: "Deploy", value: "1h 48m", hours: 1.8, maxHours: 48, level: "elite" },
];

const levelBarColor: Record<string, string> = {
  elite: "bg-perf-elite",
  high: "bg-perf-high",
  medium: "bg-perf-medium",
  low: "bg-perf-low",
};

const levelTextColor: Record<string, string> = {
  elite: "text-perf-elite",
  high: "text-perf-high",
  medium: "text-perf-medium",
  low: "text-perf-low",
};

export function CycleTimeFlow() {
  const totalHours = stages.reduce((sum, s) => sum + s.hours, 0);
  const bottleneck = stages.reduce((max, s) => (s.hours > max.hours ? s : max), stages[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="rounded-lg border border-border bg-card p-5 col-span-full lg:col-span-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Cycle Time</h3>
        <div className="flex items-center gap-1.5 text-xs text-perf-elite">
          <TrendingUp className="h-3 w-3" />
          <span>-12% vs previous</span>
        </div>
      </div>

      {/* Total Value */}
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-3xl font-bold font-mono tracking-tight text-card-foreground">
          {totalHours.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">hours</span>
        <span className="text-xs text-muted-foreground ml-1">P85 Cycle Time</span>
      </div>

      {/* Pipeline Flow */}
      <div className="flex items-stretch gap-0">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.hours / totalHours) * 100, 12);
          const isBottleneck = stage === bottleneck;
          return (
            <div key={stage.label} className="flex items-center" style={{ width: `${widthPct}%`, minWidth: 0 }}>
              <div className="flex-1 min-w-0">
                {/* Bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                  className={cn(
                    "h-3 origin-left relative",
                    levelBarColor[stage.level],
                    i === 0 && "rounded-l-full",
                    i === stages.length - 1 && "rounded-r-full"
                  )}
                  style={{ opacity: 0.85 }}
                />
                {/* Label */}
                <div className="mt-2 px-0.5">
                  <p className={cn("text-sm font-semibold font-mono", levelTextColor[stage.level])}>{stage.value}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {stage.label}
                    {isBottleneck && <AlertTriangle className="h-2.5 w-2.5 text-perf-medium" />}
                  </p>
                </div>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 mx-1 mt-[-14px]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottleneck hint */}
      <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md bg-perf-medium/8 border border-perf-medium/15">
        <AlertTriangle className="h-3.5 w-3.5 text-perf-medium shrink-0" />
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-card-foreground">{bottleneck.label}</span> é o maior gargalo.
          Considere revisar o processo para reduzir o tempo.
        </span>
      </div>
    </motion.div>
  );
}
