import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Shield } from "lucide-react";

interface RiskItem {
  component: string;
  owner: string;
  busFactor: number;
}

const riskData: RiskItem[] = [
  { component: "payment-service", owner: "Ana Silva", busFactor: 1 },
  { component: "auth-module", owner: "Carlos Lima", busFactor: 1 },
  { component: "notification-engine", owner: "Bruna Costa", busFactor: 2 },
];

export function RiskCards() {
  const criticalCount = riskData.filter((r) => r.busFactor === 1).length;

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">Risk</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bus Factor */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 13 * 0.06 }}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Bus Factor</span>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-perf-low bg-perf-low/15 px-1.5 py-0.5 rounded">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} critical
              </span>
            )}
          </div>
          <div className="space-y-2">
            {riskData.map((r) => (
              <div
                key={r.component}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md text-xs",
                  r.busFactor === 1 ? "bg-perf-low/8 border border-perf-low/20" : "bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-card-foreground">{r.component}</span>
                  <span className="text-muted-foreground">→ {r.owner}</span>
                </div>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    r.busFactor === 1 ? "text-perf-low" : "text-perf-medium"
                  )}
                >
                  BF: {r.busFactor}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Code Ownership */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 14 * 0.06 }}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Code Ownership</span>
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {[
              { label: "Strong ownership (>80%)", pct: 45, color: "bg-perf-elite" },
              { label: "Shared ownership (50-80%)", pct: 35, color: "bg-perf-high" },
              { label: "Weak ownership (<50%)", pct: 20, color: "bg-perf-medium" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-card-foreground">{item.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className={cn("h-full rounded-full", item.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
