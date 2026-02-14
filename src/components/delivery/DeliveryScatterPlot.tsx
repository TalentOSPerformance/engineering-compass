import { motion } from "framer-motion";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ZAxis,
} from "recharts";

interface PRPoint {
  title: string;
  author: string;
  size: number;
  cycleTime: number;
  sizeCategory: string;
}

const scatterData: PRPoint[] = [
  { title: "Fix auth flow", author: "Ana Silva", size: 45, cycleTime: 8, sizeCategory: "s" },
  { title: "Add payment webhook", author: "Carlos Lima", size: 280, cycleTime: 24, sizeCategory: "m" },
  { title: "Update README", author: "Bruna Costa", size: 8, cycleTime: 2, sizeCategory: "xs" },
  { title: "Refactor user service", author: "João Pedro", size: 520, cycleTime: 48, sizeCategory: "l" },
  { title: "Add rate limiting", author: "Maria Souza", size: 150, cycleTime: 16, sizeCategory: "m" },
  { title: "Fix typo", author: "Lucas Alves", size: 3, cycleTime: 1, sizeCategory: "xs" },
  { title: "New dashboard page", author: "Fernanda Reis", size: 890, cycleTime: 72, sizeCategory: "l" },
  { title: "Add caching layer", author: "Pedro Santos", size: 340, cycleTime: 32, sizeCategory: "m" },
  { title: "Migrate DB schema", author: "Ana Silva", size: 1200, cycleTime: 96, sizeCategory: "xl" },
  { title: "Add tests", author: "Carlos Lima", size: 210, cycleTime: 12, sizeCategory: "m" },
  { title: "Fix CSS bug", author: "Bruna Costa", size: 15, cycleTime: 3, sizeCategory: "s" },
  { title: "Add logging", author: "João Pedro", size: 95, cycleTime: 10, sizeCategory: "s" },
  { title: "API versioning", author: "Maria Souza", size: 450, cycleTime: 40, sizeCategory: "m" },
  { title: "Perf optimization", author: "Lucas Alves", size: 180, cycleTime: 20, sizeCategory: "m" },
  { title: "Add dark mode", author: "Fernanda Reis", size: 620, cycleTime: 56, sizeCategory: "l" },
  { title: "Fix memory leak", author: "Pedro Santos", size: 35, cycleTime: 14, sizeCategory: "s" },
  { title: "Update deps", author: "Ana Silva", size: 25, cycleTime: 4, sizeCategory: "s" },
  { title: "New onboarding", author: "Carlos Lima", size: 750, cycleTime: 64, sizeCategory: "l" },
  { title: "Config refactor", author: "Bruna Costa", size: 110, cycleTime: 8, sizeCategory: "m" },
  { title: "Add monitoring", author: "João Pedro", size: 300, cycleTime: 28, sizeCategory: "m" },
];

const sizeCategoryColors: Record<string, string> = {
  xs: "hsl(var(--perf-elite))",
  s: "hsl(var(--perf-high))",
  m: "hsl(var(--primary))",
  l: "hsl(var(--perf-medium))",
  xl: "hsl(var(--perf-low))",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as PRPoint;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium text-popover-foreground">{d.title}</p>
      <p className="text-muted-foreground">Author: {d.author}</p>
      <p className="text-muted-foreground">Size: {d.size} lines ({d.sizeCategory.toUpperCase()})</p>
      <p className="text-muted-foreground">Cycle Time: {d.cycleTime}h</p>
    </div>
  );
};

export function DeliveryScatterPlot() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Cycle Time vs PR Size</h2>
        <p className="text-xs text-muted-foreground">Cada ponto representa um PR. Cor indica categoria de tamanho.</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: "XS (<10)", cat: "xs" },
          { label: "S (10-100)", cat: "s" },
          { label: "M (100-500)", cat: "m" },
          { label: "L (500-1000)", cat: "l" },
          { label: "XL (>1000)", cat: "xl" },
        ].map((item) => (
          <div key={item.cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sizeCategoryColors[item.cat] }} />
            {item.label}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="size"
              name="PR Size (lines)"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "PR Size (lines changed)", position: "bottom", offset: 5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="number"
              dataKey="cycleTime"
              name="Cycle Time (hours)"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Cycle Time (hours)", angle: -90, position: "insideLeft", offset: 0, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <ZAxis range={[40, 40]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--muted-foreground))" }} />
            {["xs", "s", "m", "l", "xl"].map((cat) => (
              <Scatter
                key={cat}
                data={scatterData.filter((d) => d.sizeCategory === cat)}
                fill={sizeCategoryColors[cat]}
                opacity={0.8}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
