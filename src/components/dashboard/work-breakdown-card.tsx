import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface WorkBreakdownItem {
  name: string;
  value: number;
  color: string;
}

interface WorkBreakdownCardProps {
  data: WorkBreakdownItem[];
}

function WBTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-sm border border-border-default bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{d.name}</p>
      <p className="text-muted-foreground">{d.value} items</p>
    </div>
  );
}

export function WorkBreakdownCard({ data }: WorkBreakdownCardProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-md border border-border-default bg-surface p-4 card-hover overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-chart-5 opacity-40 group-hover:opacity-80 transition-opacity" />

      <h3 className="text-xs font-medium text-muted-foreground mb-2">Work Breakdown</h3>
      {hasData ? (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<WBTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 flex-1">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-center">
          <p className="text-[11px] text-muted-foreground">Sem dados no periodo</p>
        </div>
      )}
    </motion.div>
  );
}
