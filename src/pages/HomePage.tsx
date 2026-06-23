import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { ClimbingLog } from "../features/climbing/domain/types";
import type { DashboardStats } from "../features/climbing/domain/stats";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getDashboardStats } from "../features/climbing/domain/stats";
import { getGymById, getUserById } from "../features/climbing/adapters/staticDataRepository";
import { StatsSummary } from "../features/climbing/components/StatsSummary";
import { SessionCard } from "../features/climbing/components/SessionCard";
import { UserFilter } from "../features/climbing/components/UserFilter";

export function HomePage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);

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

  const activeUser = userFilter ? getUserById(data, userFilter) : undefined;

  return (
    <div className="space-y-6 py-4">
      <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-6">
        <h1 className="text-xl font-bold text-stone-100">{data.siteTitle}</h1>
        {activeUser ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeUser.color || "#a3e635" }}
              />
              <span className="text-sm font-semibold text-lime-300">
                {activeUser.name}
              </span>
            </div>
            {activeUser.bio && (
              <p className="text-sm text-stone-400 leading-relaxed">
                {activeUser.bio}
              </p>
            )}
            {activeUser.homeGym && (
              <p className="text-xs text-stone-500">
                常去岩馆：{getGymById(data, activeUser.homeGym)?.name || activeUser.homeGym}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-500">
            全部攀爬者 · {data.users.length} 人
          </p>
        )}
      </div>

      {data.users.length > 0 && (
        <UserFilter
          users={data.users}
          activeUserId={userFilter}
          onSelect={setUserFilter}
        />
      )}

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
          {stats.recentSessions.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-500">
              还没有训练记录。
            </p>
          )}
          {stats.recentSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              gym={getGymById(data, session.gymId)}
              user={getUserById(data, session.userId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
