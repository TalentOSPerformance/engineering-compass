import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export type PerfLevel = "elite" | "high" | "medium" | "low";
export type TrendDirection = "up" | "down" | "neutral";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  level?: PerfLevel;
  trend?: TrendDirection;
  trendValue?: string;
  delay?: number;
}

const levelConfig: Record<PerfLevel, { label: string; className: string }> = {
  elite: { label: "Elite", className: "bg-perf-elite/15 text-perf-elite" },
  high: { label: "High", className: "bg-perf-high/15 text-perf-high" },
  medium: { label: "Medium", className: "bg-perf-medium/15 text-perf-medium" },
  low: { label: "Low", className: "bg-perf-low/15 text-perf-low" },
};

const trendConfig: Record<TrendDirection, { icon: typeof TrendingUp; className: string }> = {
  up: { icon: TrendingUp, className: "text-perf-elite" },
  down: { icon: TrendingDown, className: "text-perf-low" },
  neutral: { icon: Minus, className: "text-muted-foreground" },
};

export function MetricCard({ title, value, unit, level, trend, trendValue, delay = 0 }: MetricCardProps) {
  const levelInfo = level ? levelConfig[level] : null;
  const trendInfo = trend ? trendConfig[trend] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.06, ease: "easeOut" }}
      className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {levelInfo && (
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", levelInfo.className)}>
            {levelInfo.label}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold font-mono tracking-tight text-card-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {trendInfo && (
        <div className={cn("flex items-center gap-1 text-xs", trendInfo.className)}>
          <trendInfo.icon className="h-3 w-3" />
          {trendValue && <span>{trendValue}</span>}
        </div>
      )}
    </motion.div>
  );
}
