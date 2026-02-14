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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.06 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <h3 className="text-xs font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d, i) => {
          const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.5, delay: delay * 0.06 + i * 0.04 }}
                className={cn("w-full rounded-sm min-h-[2px]", color)}
              />
              <span className="text-[9px] text-muted-foreground font-mono">{d.label}</span>
            </div>
          );
        })}
      </div>
      {target !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
          <span className="text-[9px] text-muted-foreground">target: {target}</span>
        </div>
      )}
    </motion.div>
  );
}
