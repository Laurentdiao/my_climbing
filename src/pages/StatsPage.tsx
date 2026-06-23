import { useState, useEffect, useMemo } from "react";
import type { ClimbingLog } from "../features/climbing/domain/types";
import type { DashboardStats } from "../features/climbing/domain/stats";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getDashboardStats } from "../features/climbing/domain/stats";
import { StatsSummary } from "../features/climbing/components/StatsSummary";
import {
  MonthlyTrendChart,
  GymDistributionChart,
  GradeDistributionChart,
} from "../features/climbing/components/StatsPanel";

export function StatsPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [userFilter, setUserFilter] = useState<string>("");

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  const stats = useMemo<DashboardStats | null>(() => {
    if (!data) return null;
    const sessions = userFilter
      ? data.sessions.filter((s) => s.userId === userFilter)
      : data.sessions;
    return getDashboardStats({ ...data, sessions });
  }, [data, userFilter]);

  if (!data || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
      </div>
    );
  }

  const activeUser = userFilter
    ? data.users.find((u) => u.id === userFilter)
    : undefined;

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-lg font-bold text-stone-100">数据统计</h1>
        <p className="mt-0.5 text-xs text-stone-500">
          {activeUser ? (
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: activeUser.color || "#a3e635" }}
              />
              {activeUser.name}
            </span>
          ) : (
            "全部攀爬者"
          )}
          {" · "}{stats.totalSessions} 场训练 · {stats.totalProblems} 条线路
        </p>
      </div>

      {data.users.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-stone-500">攀爬者</p>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-lime-400 focus:outline-none"
          >
            <option value="">全部</option>
            {data.users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      <StatsSummary stats={stats} />

      <MonthlyTrendChart stats={stats} />

      <GymDistributionChart stats={stats} />

      <GradeDistributionChart stats={stats} />
    </div>
  );
}
