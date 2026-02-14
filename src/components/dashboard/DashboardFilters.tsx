import { cn } from "@/lib/utils";

interface TeamFilterProps {
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const teams = [
  { id: "all", name: "All Teams" },
  { id: "platform", name: "Platform" },
  { id: "platform-core", name: "  Core" },
  { id: "platform-infra", name: "  Infra" },
  { id: "product", name: "Product" },
  { id: "product-growth", name: "  Growth" },
  { id: "product-payments", name: "  Payments" },
  { id: "mobile", name: "Mobile" },
];

const periods = ["7d", "14d", "30d", "90d"];

export function DashboardFilters({ selectedTeam, onTeamChange, selectedPeriod, onPeriodChange }: TeamFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Team Selector */}
      <select
        value={selectedTeam}
        onChange={(e) => onTeamChange(e.target.value)}
        className="h-9 rounded-lg border border-border/60 bg-card px-3 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Period Selector */}
      <div className="flex items-center rounded-lg border border-border/60 bg-card overflow-hidden p-0.5">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold transition-all rounded-md",
              selectedPeriod === p
                ? "bg-primary text-primary-foreground shadow-sm"
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
