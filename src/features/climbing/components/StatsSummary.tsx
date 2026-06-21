import type { DashboardStats } from "../domain/stats";

interface StatsSummaryProps {
  stats: DashboardStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
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
          className="rounded-2xl border border-stone-800/90 bg-stone-900/70 p-4 text-center shadow-[0_18px_55px_rgba(0,0,0,0.16)]"
        >
          <div
            className="font-nums text-2xl font-bold text-lime-300"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {card.value}
          </div>
          <div className="mt-0.5 text-xs text-stone-500">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
