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
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[10px] font-mono font-semibold text-popover-foreground shadow-lg">
      {payload[0].value}
    </div>
  );
};

export function SparklineCard({ title, value, unit, data, color, delay = 0 }: SparklineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.06 }}
      className="rounded-xl bg-card p-5 flex flex-col justify-between card-hover border border-border/60"
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-bold font-mono tracking-tighter text-card-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{unit}</span>
      </div>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`spark-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<MiniTooltip />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#spark-${title.replace(/\s/g, "")})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
