import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ClimbingLog } from "../features/climbing/domain/types";
import type { DashboardStats } from "../features/climbing/domain/stats";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getDashboardStats } from "../features/climbing/domain/stats";
import { getGymById } from "../features/climbing/adapters/staticDataRepository";
import { StatsSummary } from "../features/climbing/components/StatsPanel";
import { SessionCard } from "../features/climbing/components/SessionCard";

export function HomePage() {
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

  const { profile } = data;

  return (
    <div className="space-y-6 py-4">
      <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-6">
        <h1 className="text-xl font-bold text-stone-100">{profile.displayName}</h1>
        <h2 className="mt-0.5 text-sm text-lime-400">{profile.siteTitle}</h2>
        {profile.bio && (
          <p className="mt-3 text-sm text-stone-400 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      <StatsSummary stats={stats} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-300">
            最近训练
          </h3>
          <Link
            to="/sessions"
            className="text-xs text-lime-400 hover:text-lime-300 transition-colors"
          >
            全部记录 →
          </Link>
        </div>
        <div className="space-y-3">
          {stats.recentSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              gym={getGymById(data, session.gymId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
