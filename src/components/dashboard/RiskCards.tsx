import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, ChevronRight } from "lucide-react";

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
      <h2 className="text-sm font-semibold text-foreground mb-3 tracking-wide">Risk</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bus Factor */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 13 * 0.06 }}
          className="rounded-xl bg-card p-5 border border-border/60"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bus Factor</span>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-perf-low bg-perf-low/10 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} críticos
              </span>
            )}
          </div>
          <div className="space-y-2">
            {riskData.map((r) => (
              <div
                key={r.component}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs group cursor-pointer transition-colors",
                  r.busFactor === 1
                    ? "bg-perf-low/6 border border-perf-low/15 hover:bg-perf-low/10"
                    : "bg-muted/40 hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-semibold text-card-foreground">{r.component}</span>
                  <span className="text-muted-foreground">→ {r.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono font-bold",
                      r.busFactor === 1 ? "text-perf-low" : "text-perf-medium"
                    )}
                  >
                    BF: {r.busFactor}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Code Ownership */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 14 * 0.06 }}
          className="rounded-xl bg-card p-5 border border-border/60"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code Ownership</span>
            <Shield className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div className="space-y-4">
            {[
              { label: "Strong (>80%)", pct: 45, color: "bg-perf-elite" },
              { label: "Shared (50-80%)", pct: 35, color: "bg-perf-high" },
              { label: "Weak (<50%)", pct: 20, color: "bg-perf-medium" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-mono font-bold text-card-foreground">{item.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
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
