import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, ArrowRight, Zap } from "lucide-react";

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

const levelGlow: Record<string, string> = {
  elite: "shadow-[0_0_12px_-2px_hsl(var(--perf-elite)/0.4)]",
  high: "shadow-[0_0_12px_-2px_hsl(var(--perf-high)/0.4)]",
  medium: "shadow-[0_0_12px_-2px_hsl(var(--perf-medium)/0.4)]",
  low: "shadow-[0_0_12px_-2px_hsl(var(--perf-low)/0.4)]",
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="relative rounded-xl bg-card p-6 col-span-full lg:col-span-3 overflow-hidden border border-border/60"
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground tracking-wide">Cycle Time</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-perf-elite font-medium bg-perf-elite/8 px-2.5 py-1 rounded-full">
          <TrendingUp className="h-3 w-3" />
          <span>-12% vs anterior</span>
        </div>
      </div>

      {/* Total Value — dramatic */}
      <div className="flex items-baseline gap-3 mb-6 relative">
        <span className="text-5xl font-bold font-mono tracking-tighter text-card-foreground">
          {totalHours.toFixed(1)}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-muted-foreground">horas</span>
          <span className="text-[10px] text-muted-foreground/70">P85 Cycle Time</span>
        </div>
      </div>

      {/* Pipeline Flow — thicker, glowing bars */}
      <div className="flex items-stretch gap-1 relative">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.hours / totalHours) * 100, 14);
          const isBottleneck = stage === bottleneck;
          return (
            <div key={stage.label} className="flex items-center" style={{ width: `${widthPct}%`, minWidth: 0 }}>
              <div className="flex-1 min-w-0 group/stage">
                {/* Bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.25 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={cn(
                    "h-5 origin-left relative rounded-md",
                    levelBarColor[stage.level],
                    levelGlow[stage.level],
                    "group-hover/stage:scale-y-110 transition-transform duration-200"
                  )}
                  style={{ opacity: 0.9 }}
                />
                {/* Label */}
                <div className="mt-3 px-0.5">
                  <p className={cn("text-base font-bold font-mono tracking-tight", levelTextColor[stage.level])}>
                    {stage.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium uppercase tracking-wider">
                    {stage.label}
                    {isBottleneck && (
                      <span className="inline-flex items-center gap-0.5 text-perf-medium">
                        <AlertTriangle className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0 mx-1 mt-[-18px]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottleneck hint — more integrated */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-5 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-perf-medium/6 border border-perf-medium/15"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-perf-medium shrink-0" />
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-card-foreground">{bottleneck.label}</span> é o maior gargalo — considere revisar o processo.
        </span>
      </motion.div>
    </motion.div>
  );
}
