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
    <div className="rounded-md border border-border-default bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{d.name}</p>
      <p className="text-muted-foreground">{d.value} items</p>
    </div>
  );
}

export function WorkBreakdownCard({ data }: WorkBreakdownCardProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="rounded-xl border border-border-default bg-surface p-4"
    >
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
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
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
