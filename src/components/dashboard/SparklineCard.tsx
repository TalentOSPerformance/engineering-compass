import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SparklineCardProps {
  title: string;
  value: string;
  unit: string;
  data: { v: number }[];
  color: string;
  delay?: number;
}

const MiniTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-popover px-2 py-1 text-[10px] font-mono text-popover-foreground shadow-sm">
      {payload[0].value}
    </div>
  );
};

export function SparklineCard({ title, value, unit, data, color, delay = 0 }: SparklineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.06 }}
      className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between"
    >
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-xl font-semibold font-mono tracking-tight text-card-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`spark-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<MiniTooltip />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#spark-${title.replace(/\s/g, "")})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
