import type { DashboardStats } from "../domain/stats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatsPanelProps {
  stats: DashboardStats;
}

export function StatsSummary({ stats }: StatsPanelProps) {
  const cards = [
    { label: "训练场次", value: stats.totalSessions },
    { label: "线路总数", value: stats.totalProblems },
    { label: "岩馆数量", value: stats.gymDistribution.length },
    { label: "难度范围", value: stats.gradeDistribution.length },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 text-center"
        >
          <div className="text-2xl font-bold text-lime-400 font-nums" style={{ fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
          <div className="mt-0.5 text-xs text-stone-500">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({ stats }: StatsPanelProps) {
  if (stats.monthlyTrend.length === 0) return null;

  const years = new Set(stats.monthlyTrend.map((x) => x.month.substring(0, 4)));
  const data = stats.monthlyTrend.map((m) => {
    const [year, month] = m.month.split("-");
    return {
      month: years.size > 1 ? `${year}-${month}` : `${parseInt(month)}月`,
      quantity: m.quantity,
    };
  });

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-300">
        月度趋势
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={{ stroke: "#292524" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={{ stroke: "#292524" }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1917",
              border: "1px solid #44403c",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#d6d3d1",
            }}
          />
          <Bar dataKey="quantity" fill="#a3e635" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const chartColors = [
  "#a3e635",
  "#84cc16",
  "#65a30d",
  "#4d7c0f",
  "#3f6212",
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
];

export function GymDistributionChart({ stats }: StatsPanelProps) {
  if (stats.gymDistribution.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-300">
        岩馆分布
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={stats.gymDistribution}
          layout="vertical"
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#292524" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={{ stroke: "#292524" }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            dataKey="gymName"
            type="category"
            tick={{ fontSize: 11, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1917",
              border: "1px solid #44403c",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#d6d3d1",
            }}
          />
          <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
            {stats.gymDistribution.map((_, index) => (
              <Cell
                key={index}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GradeDistributionChart({ stats }: StatsPanelProps) {
  if (stats.gradeDistribution.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-300">
        难度分布
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={stats.gradeDistribution}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
          <XAxis
            dataKey="gradeLabel"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={{ stroke: "#292524" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={{ stroke: "#292524" }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1917",
              border: "1px solid #44403c",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#d6d3d1",
            }}
          />
          <Bar dataKey="quantity" fill="#a3e635" radius={[4, 4, 0, 0]}>
            {stats.gradeDistribution.map((_, index) => (
              <Cell
                key={index}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
