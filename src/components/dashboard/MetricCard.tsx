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

const levelConfig: Record<PerfLevel, { label: string; dotClass: string; bgClass: string }> = {
  elite: { label: "Elite", dotClass: "bg-perf-elite", bgClass: "bg-perf-elite/8" },
  high: { label: "High", dotClass: "bg-perf-high", bgClass: "bg-perf-high/8" },
  medium: { label: "Medium", dotClass: "bg-perf-medium", bgClass: "bg-perf-medium/8" },
  low: { label: "Low", dotClass: "bg-perf-low", bgClass: "bg-perf-low/8" },
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative rounded-xl bg-card p-5 card-hover overflow-hidden border border-border/60"
    >
      {/* Subtle top accent line */}
      {levelInfo && (
        <div className={cn("absolute top-0 left-4 right-4 h-[2px] rounded-b-full opacity-60", levelInfo.dotClass)} />
      )}
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{title}</span>
        {levelInfo && (
          <span className={cn("flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full", levelInfo.bgClass)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", levelInfo.dotClass)} />
            <span className="text-card-foreground">{levelInfo.label}</span>
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono tracking-tighter text-card-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>
      {trendInfo && (
        <div className={cn("flex items-center gap-1.5 text-xs mt-3 font-medium", trendInfo.className)}>
          <trendInfo.icon className="h-3.5 w-3.5" />
          {trendValue && <span>{trendValue}</span>}
        </div>
      )}
    </motion.div>
  );
}
