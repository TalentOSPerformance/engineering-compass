import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface TeamRow {
  id: string;
  name: string;
  isChild?: boolean;
  cycleTime: string;
  deployFreq: string;
  cfr: string;
  prPickup: string;
  level: "elite" | "high" | "medium" | "low";
}

const teamsData: TeamRow[] = [
  { id: "platform", name: "Platform", cycleTime: "14.2h", deployFreq: "5.1/d", cfr: "2.1%", prPickup: "1.8h", level: "elite" },
  { id: "platform-core", name: "Core", isChild: true, cycleTime: "12.0h", deployFreq: "6.2/d", cfr: "1.5%", prPickup: "1.2h", level: "elite" },
  { id: "platform-infra", name: "Infra", isChild: true, cycleTime: "18.4h", deployFreq: "3.8/d", cfr: "3.0%", prPickup: "2.8h", level: "high" },
  { id: "product", name: "Product", cycleTime: "22.1h", deployFreq: "3.2/d", cfr: "4.5%", prPickup: "3.5h", level: "high" },
  { id: "product-growth", name: "Growth", isChild: true, cycleTime: "19.8h", deployFreq: "3.8/d", cfr: "3.8%", prPickup: "2.9h", level: "high" },
  { id: "product-payments", name: "Payments", isChild: true, cycleTime: "26.0h", deployFreq: "2.4/d", cfr: "5.8%", prPickup: "4.5h", level: "medium" },
  { id: "mobile", name: "Mobile", cycleTime: "28.5h", deployFreq: "1.8/d", cfr: "6.2%", prPickup: "5.1h", level: "medium" },
];

const levelDot: Record<string, string> = {
  elite: "bg-perf-elite",
  high: "bg-perf-high",
  medium: "bg-perf-medium",
  low: "bg-perf-low",
};

export function TeamsTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.2 }}
    >
      <h2 className="text-sm font-semibold text-foreground mb-3 tracking-wide">Teams Overview</h2>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Team</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Cycle Time</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Deploy Freq</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">CFR</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">PR Pickup</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {teamsData.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-2 w-2 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card", levelDot[t.level], `ring-${t.level === 'elite' ? 'perf-elite' : t.level === 'high' ? 'perf-high' : 'perf-medium'}/20`)} />
                      <span className={cn("font-medium text-card-foreground", t.isChild && "pl-4 text-muted-foreground text-[11px]")}>
                        {t.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right px-5 py-3 font-mono font-semibold text-card-foreground">{t.cycleTime}</td>
                  <td className="text-right px-5 py-3 font-mono font-semibold text-card-foreground">{t.deployFreq}</td>
                  <td className="text-right px-5 py-3 font-mono font-semibold text-card-foreground">{t.cfr}</td>
                  <td className="text-right px-5 py-3 font-mono font-semibold text-card-foreground">{t.prPickup}</td>
                  <td className="px-3 py-3">
                    <Link to={`/teams/${t.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
