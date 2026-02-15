'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const BENCHMARK_ROWS = [
  {
    metric: 'Deploy Frequency',
    elite: 'Multiple/day',
    high: '1/week–1/month',
    medium: '1/month–6/months',
    low: '<1/6 months',
  },
  {
    metric: 'Lead Time',
    elite: '<1 hour',
    high: '1 day–1 week',
    medium: '1 week–1 month',
    low: '>6 months',
  },
  {
    metric: 'CFR',
    elite: '0–15%',
    high: '16–30%',
    medium: '16–30%',
    low: '46–60%',
  },
  {
    metric: 'MTTR',
    elite: '<1 hour',
    high: '<1 day',
    medium: '<1 day',
    low: '1 week–1 month',
  },
] as const;

export interface DORAMetricsCurrent {
  deploymentFrequency: { value: number; unit: string; level: string };
  leadTimeForChanges: { value: number; unit: string; level: string };
  changeFailureRate: { value: number; unit: string; level: string };
  timeToRestore: { value: number; unit: string; level: string };
}

export function DORABenchmarks({ current }: { current: DORAMetricsCurrent }) {
  const getYours = (metric: (typeof BENCHMARK_ROWS)[number]['metric']) => {
    if (metric === 'Deploy Frequency') return `${current.deploymentFrequency.value} ${current.deploymentFrequency.unit}`;
    if (metric === 'Lead Time') return `${current.leadTimeForChanges.value} ${current.leadTimeForChanges.unit}`;
    if (metric === 'CFR') {
      const v = current.changeFailureRate.value;
      return `${v <= 1 ? (v * 100).toFixed(1) : v}%`;
    }
    if (metric === 'MTTR') return `${current.timeToRestore.value} ${current.timeToRestore.unit}`;
    return '—';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.5 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground">
            DORA Benchmarks (2024 State of DevOps)
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Metric</th>
                  <th className="text-center px-4 py-2.5 font-medium text-perf-elite">Elite</th>
                  <th className="text-center px-4 py-2.5 font-medium text-perf-high">High</th>
                  <th className="text-center px-4 py-2.5 font-medium text-perf-medium">Medium</th>
                  <th className="text-center px-4 py-2.5 font-medium text-perf-low">Low</th>
                  <th className="text-center px-4 py-2.5 font-medium text-primary">Your Team</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_ROWS.map((row) => (
                  <tr key={row.metric} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-card-foreground">{row.metric}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{row.elite}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{row.high}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{row.medium}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{row.low}</td>
                    <td className="px-4 py-2.5 text-center font-mono font-semibold text-primary">
                      {getYours(row.metric)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
