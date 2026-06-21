import { useState, useEffect } from "react";
import type { ClimbingLog } from "../features/climbing/domain/types";
import type { DashboardStats } from "../features/climbing/domain/stats";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getDashboardStats } from "../features/climbing/domain/stats";
import {
  StatsSummary,
  MonthlyTrendChart,
  GymDistributionChart,
  GradeDistributionChart,
} from "../features/climbing/components/StatsPanel";

export function StatsPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadClimbingLog().then((d) => {
      setData(d);
      setStats(getDashboardStats(d));
    });
  }, []);

  if (!data || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-lg font-bold text-stone-100">数据统计</h1>
      </div>

      <StatsSummary stats={stats} />

      <MonthlyTrendChart stats={stats} />

      <GymDistributionChart stats={stats} />

      <GradeDistributionChart stats={stats} />
    </div>
  );
}
