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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 1.2 }}
    >
      <h2 className="text-sm font-semibold text-foreground mb-3">Teams Overview</h2>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Team</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cycle Time</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Deploy Freq</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">CFR</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">PR Pickup</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {teamsData.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", levelDot[t.level])} />
                      <span className={cn("font-medium text-card-foreground", t.isChild && "pl-4 text-muted-foreground")}>
                        {t.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-2.5 font-mono text-card-foreground">{t.cycleTime}</td>
                  <td className="text-right px-4 py-2.5 font-mono text-card-foreground">{t.deployFreq}</td>
                  <td className="text-right px-4 py-2.5 font-mono text-card-foreground">{t.cfr}</td>
                  <td className="text-right px-4 py-2.5 font-mono text-card-foreground">{t.prPickup}</td>
                  <td className="px-2 py-2.5">
                    <Link to={`/teams/${t.id}`} className="text-muted-foreground hover:text-card-foreground transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
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
