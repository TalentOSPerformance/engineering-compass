import { useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DORACards } from "@/components/dashboard/DORACards";
import { FlowHealthCards } from "@/components/dashboard/FlowHealthCards";
import { RiskCards } from "@/components/dashboard/RiskCards";
import { MetricTrend } from "@/components/dashboard/MetricTrend";
import { TeamsTable } from "@/components/dashboard/TeamsTable";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { CycleTimeFlow } from "@/components/dashboard/CycleTimeFlow";
import { SparklineCard } from "@/components/dashboard/SparklineCard";
import { WorkBreakdownCard } from "@/components/dashboard/WorkBreakdownCard";

const sparklineData = {
  prSize: [{ v: 800 }, { v: 950 }, { v: 1100 }, { v: 1050 }, { v: 1200 }, { v: 1150 }, { v: 1100 }, { v: 1050 }],
  prsOpened: [{ v: 0.3 }, { v: 0.4 }, { v: 0.5 }, { v: 0.45 }, { v: 0.5 }, { v: 0.55 }, { v: 0.5 }, { v: 0.5 }],
  deployFreq: [{ v: 0.1 }, { v: 0.12 }, { v: 0.15 }, { v: 0.14 }, { v: 0.16 }, { v: 0.18 }, { v: 0.17 }, { v: 0.17 }],
};

const trendData = {
  cycleTime: [
    { label: "W1", value: 22 }, { label: "W2", value: 20 }, { label: "W3", value: 19 },
    { label: "W4", value: 21 }, { label: "W5", value: 18 }, { label: "W6", value: 17 },
    { label: "W7", value: 18 }, { label: "W8", value: 16 },
  ],
  deployFreq: [
    { label: "W1", value: 3.2 }, { label: "W2", value: 3.5 }, { label: "W3", value: 3.8 },
    { label: "W4", value: 3.6 }, { label: "W5", value: 4.0 }, { label: "W6", value: 4.1 },
    { label: "W7", value: 3.9 }, { label: "W8", value: 4.2 },
  ],
  cfr: [
    { label: "W1", value: 5.2 }, { label: "W2", value: 4.8 }, { label: "W3", value: 4.5 },
    { label: "W4", value: 4.2 }, { label: "W5", value: 3.8 }, { label: "W6", value: 3.5 },
    { label: "W7", value: 3.4 }, { label: "W8", value: 3.2 },
  ],
  pickupTime: [
    { label: "W1", value: 4.5 }, { label: "W2", value: 4.2 }, { label: "W3", value: 3.8 },
    { label: "W4", value: 4.0 }, { label: "W5", value: 3.6 }, { label: "W6", value: 3.4 },
    { label: "W7", value: 3.5 }, { label: "W8", value: 3.2 },
  ],
};

export default function Dashboard() {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visão executiva das métricas de engenharia</p>
        </div>
        <DashboardFilters
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      {/* Hero Row: Cycle Time Flow + Work Breakdown + Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
        <CycleTimeFlow />
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <WorkBreakdownCard />
          <SparklineCard
            title="PR Size"
            value="1.1k"
            unit="P75 changes/PR"
            data={sparklineData.prSize}
            color="hsl(var(--perf-medium))"
            delay={3}
          />
          <SparklineCard
            title="PRs Opened"
            value="0.5"
            unit="PRs/day"
            data={sparklineData.prsOpened}
            color="hsl(var(--perf-high))"
            delay={4}
          />
        </div>
      </div>

      {/* DORA */}
      <DORACards />

      {/* Flow Health */}
      <FlowHealthCards />

      {/* Risk */}
      <RiskCards />

      {/* Trends */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Trends</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTrend title="Cycle Time" data={trendData.cycleTime} target={20} delay={15} />
          <MetricTrend title="Deploy Frequency" data={trendData.deployFreq} color="bg-perf-elite" delay={16} />
          <MetricTrend title="Change Failure Rate" data={trendData.cfr} color="bg-perf-medium" target={5} delay={17} />
          <MetricTrend title="PR Pickup Time" data={trendData.pickupTime} color="bg-chart-5" delay={18} />
        </div>
      </div>

      {/* Teams Table */}
      <TeamsTable />
    </div>
  );
}
