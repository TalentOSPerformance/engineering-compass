import { MetricCard, type PerfLevel, type TrendDirection } from "./MetricCard";

interface DORAMetric {
  title: string;
  value: string | number;
  unit: string;
  level: PerfLevel;
  trend: TrendDirection;
  trendValue: string;
}

const doraMetrics: DORAMetric[] = [
  { title: "Deploy Frequency", value: "4.2", unit: "deploys/day", level: "elite", trend: "up", trendValue: "+12%" },
  { title: "Lead Time", value: "2.1", unit: "hours", level: "high", trend: "down", trendValue: "-8%" },
  { title: "Change Failure Rate", value: "3.2", unit: "%", level: "elite", trend: "up", trendValue: "-1.5%" },
  { title: "Time to Restore", value: "0.8", unit: "hours", level: "elite", trend: "up", trendValue: "-15%" },
];

export function DORACards() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3 tracking-wide">DORA Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {doraMetrics.map((m, i) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            unit={m.unit}
            level={m.level}
            trend={m.trend}
            trendValue={m.trendValue}
            delay={i + 5}
          />
        ))}
      </div>
    </div>
  );
}
