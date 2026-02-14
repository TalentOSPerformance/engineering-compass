import { cn } from "@/lib/utils";

interface TeamFilterProps {
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const teams = [
  { id: "all", name: "All Teams", type: "all" },
  { id: "platform", name: "Platform", type: "parent" },
  { id: "platform-core", name: "  Core", type: "child" },
  { id: "platform-infra", name: "  Infra", type: "child" },
  { id: "product", name: "Product", type: "parent" },
  { id: "product-growth", name: "  Growth", type: "child" },
  { id: "product-payments", name: "  Payments", type: "child" },
  { id: "mobile", name: "Mobile", type: "orphan" },
];

const periods = ["7d", "14d", "30d", "90d"];

const typeBadgeClass: Record<string, string> = {
  all: "bg-perf-high/15 text-perf-high",
  parent: "bg-perf-elite/15 text-perf-elite",
  child: "bg-chart-5/15 text-chart-5",
  orphan: "bg-perf-medium/15 text-perf-medium",
};

export function DashboardFilters({ selectedTeam, onTeamChange, selectedPeriod, onPeriodChange }: TeamFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Team Selector */}
      <select
        value={selectedTeam}
        onChange={(e) => onTeamChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-card px-3 text-xs text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Period Selector */}
      <div className="flex items-center rounded-md border border-border bg-card overflow-hidden">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              selectedPeriod === p
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
