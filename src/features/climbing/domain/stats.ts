import type { ClimbingLog, Session, Entry } from "./types";
import { compareGradeRank } from "./grade";

export interface DashboardStats {
  totalSessions: number;
  totalProblems: number;
  completedProblems: number;
  completionRate: number;
  highestGrade: string | null;
  highestGradeRank: number | null;
  monthlyTrend: MonthlyBucket[];
  gymDistribution: GymBucket[];
  gradeDistribution: GradeBucket[];
  recentSessions: Session[];
}

export interface MonthlyBucket {
  month: string;
  quantity: number;
}

export interface GymBucket {
  gymId: string;
  gymName: string;
  quantity: number;
}

export interface GradeBucket {
  gradeLabel: string;
  gradeRank: number;
  quantity: number;
}

export function getDashboardStats(data: ClimbingLog): DashboardStats {
  const totalSessions = data.sessions.length;

  let totalProblems = 0;
  let completedProblems = 0;
  let highestGradeRank: number | null = null;

  const monthMap = new Map<string, number>();
  const gymMap = new Map<string, { quantity: number; name: string }>();
  const gradeMap = new Map<string, { quantity: number; rank: number }>();

  for (const session of data.sessions) {
    const monthKey = session.climbedAt.substring(0, 7);
    let sessionQuantity = 0;

    const gymBucket = gymMap.get(session.gymId) || { quantity: 0, name: "" };
    if (!gymBucket.name) {
      const gym = data.gyms.find((g) => g.id === session.gymId);
      gymBucket.name = gym?.name ?? session.gymId;
    }

    for (const entry of session.entries) {
      totalProblems += entry.quantity;
      sessionQuantity += entry.quantity;

      if (["flash", "sent", "repeat"].includes(entry.result)) {
        completedProblems += entry.quantity;
        if (
          highestGradeRank === null ||
          entry.gradeRank > highestGradeRank
        ) {
          highestGradeRank = entry.gradeRank;
        }
      }

      const gradeBucket = gradeMap.get(entry.gradeLabel) || {
        quantity: 0,
        rank: entry.gradeRank,
      };
      gradeBucket.quantity += entry.quantity;
      gradeMap.set(entry.gradeLabel, gradeBucket);
    }

    gymBucket.quantity += sessionQuantity;
    gymMap.set(session.gymId, gymBucket);

    monthMap.set(
      monthKey,
      (monthMap.get(monthKey) || 0) + sessionQuantity,
    );
  }

  const completionRate =
    totalProblems > 0
      ? Math.round((completedProblems / totalProblems) * 1000) / 10
      : 0;

  let highestGrade: string | null = null;
  if (highestGradeRank !== null) {
    const found = data.sessions
      .flatMap((s) => s.entries)
      .find(
        (e) =>
          e.gradeRank === highestGradeRank &&
          ["flash", "sent", "repeat"].includes(e.result),
      );
    highestGrade = found?.gradeLabel ?? null;
  }

  const monthlyTrend: MonthlyBucket[] = Array.from(monthMap.entries())
    .map(([month, quantity]) => ({ month, quantity }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const gymDistribution: GymBucket[] = Array.from(gymMap.entries())
    .map(([gymId, { quantity, name }]) => ({
      gymId,
      gymName: name,
      quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const gradeDistribution: GradeBucket[] = Array.from(gradeMap.entries())
    .map(([gradeLabel, { quantity, rank }]) => ({
      gradeLabel,
      gradeRank: rank,
      quantity,
    }))
    .sort((a, b) => compareGradeRank(a.gradeRank, b.gradeRank));

  const recentSessions = [...data.sessions]
    .sort(
      (a, b) =>
        new Date(b.climbedAt).getTime() - new Date(a.climbedAt).getTime(),
    )
    .slice(0, 5);

  return {
    totalSessions,
    totalProblems,
    completedProblems,
    completionRate,
    highestGrade,
    highestGradeRank,
    monthlyTrend,
    gymDistribution,
    gradeDistribution,
    recentSessions,
  };
}

export function getSessionById(
  data: ClimbingLog,
  sessionId: string,
): Session | undefined {
  return data.sessions.find((s) => s.id === sessionId);
}

export function filterSessions(
  data: ClimbingLog,
  filters: {
    gymId?: string;
    discipline?: string;
    minGradeRank?: number;
    maxGradeRank?: number;
    result?: string;
  },
): Session[] {
  let sessions = [...data.sessions];

  if (filters.gymId) {
    sessions = sessions.filter((s) => s.gymId === filters.gymId);
  }
  if (filters.discipline) {
    sessions = sessions.filter((s) => s.discipline === filters.discipline);
  }
  if (filters.minGradeRank !== undefined || filters.maxGradeRank !== undefined) {
    sessions = sessions.filter((s) =>
      s.entries.some((e) => {
        if (
          filters.minGradeRank !== undefined &&
          e.gradeRank < filters.minGradeRank
        )
          return false;
        if (
          filters.maxGradeRank !== undefined &&
          e.gradeRank > filters.maxGradeRank
        )
          return false;
        return true;
      }),
    );
  }
  if (filters.result) {
    sessions = sessions.filter((s) =>
      s.entries.some((e) => e.result === filters.result),
    );
  }

  sessions.sort(
    (a, b) =>
      new Date(b.climbedAt).getTime() - new Date(a.climbedAt).getTime(),
  );

  return sessions;
}

export function getSessionEntriesTotal(entries: Entry[]): number {
  return entries.reduce((sum, e) => sum + e.quantity, 0);
}
