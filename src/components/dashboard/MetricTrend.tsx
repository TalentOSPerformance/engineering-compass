import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BarData {
  label: string;
  value: number;
}

interface MetricTrendProps {
  title: string;
  data: BarData[];
  target?: number;
  color?: string;
  delay?: number;
}

export function MetricTrend({ title, data, target, color = "bg-primary", delay = 0 }: MetricTrendProps) {
  const maxVal = Math.max(...data.map((d) => d.value), target || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.06 }}
      className="rounded-xl bg-card p-5 card-hover border border-border/60 group"
    >
      <h3 className="text-xs font-medium text-muted-foreground mb-5 uppercase tracking-wider">{title}</h3>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          const isLast = i === data.length - 1;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.5, delay: delay * 0.06 + i * 0.04 }}
                className={cn(
                  "w-full rounded-md min-h-[3px] transition-opacity",
                  color,
                  isLast ? "opacity-100" : "opacity-50 group-hover:opacity-80"
                )}
              />
              <span className="text-[9px] text-muted-foreground font-mono">{d.label}</span>
            </div>
          );
        })}
      </div>
      {target !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-muted-foreground/20" />
          <span className="text-[10px] text-muted-foreground font-mono">target: {target}</span>
        </div>
      )}
    </motion.div>
  );
}
