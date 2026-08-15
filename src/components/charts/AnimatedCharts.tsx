import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUIStore } from "@/stores/uiStore";
import { fmtMoney } from "@/lib/format";

const INDIGO = "#4F46E5";
const INDIGO_DARK = "#6366F1";

export function useChartTheme() {
  const theme = useUIStore((s) => s.theme);
  const dark = theme === "dark";
  return {
    grid: dark ? "#334155" : "#E2E8F0",
    tick: dark ? "#94A3B8" : "#64748B",
    stroke: dark ? INDIGO_DARK : INDIGO,
    fill: dark ? INDIGO_DARK : INDIGO,
    tooltipBg: dark ? "#1E293B" : "#FFFFFF",
    tooltipBorder: dark ? "#334155" : "#E2E8F0",
    tooltipColor: dark ? "#F8FAFC" : "#0F172A",
  };
}

type Point = Record<string, string | number>;

export function AnimatedLineChart({
  data,
  xKey,
  yKey,
  yLabel = "Revenue",
  money = true,
}: {
  data: Point[];
  xKey: string;
  yKey: string;
  yLabel?: string;
  money?: boolean;
}) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: t.tick }} dy={10} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: t.tick }}
          tickFormatter={(val) => (money ? fmtMoney(Number(val)) : String(val))}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: t.tooltipBg,
            borderRadius: 8,
            border: `1px solid ${t.tooltipBorder}`,
            color: t.tooltipColor,
          }}
          formatter={(value) => [money ? fmtMoney(Number(value)) : String(value), yLabel]}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={t.stroke}
          strokeWidth={3}
          className="chart-line-flow"
          isAnimationActive
          animationDuration={1200}
          dot={{ r: 5, fill: t.stroke, stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AnimatedBarChart({
  data,
  xKey,
  yKey,
  yLabel = "Sales",
  money = true,
}: {
  data: Point[];
  xKey: string;
  yKey: string;
  yLabel?: string;
  money?: boolean;
}) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
        <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: t.tick }} dy={10} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: t.tick }}
          tickFormatter={(val) => (money ? fmtMoney(Number(val)) : String(val))}
        />
        <Tooltip
          cursor={{ fill: t.grid, opacity: 0.25 }}
          contentStyle={{
            backgroundColor: t.tooltipBg,
            borderRadius: 8,
            border: `1px solid ${t.tooltipBorder}`,
            color: t.tooltipColor,
          }}
          formatter={(value) => [money ? fmtMoney(Number(value)) : String(value), yLabel]}
        />
        <Bar dataKey={yKey} fill={t.fill} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}
