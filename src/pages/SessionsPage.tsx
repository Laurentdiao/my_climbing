import { useState, useEffect, useMemo } from "react";
import type { ClimbingLog } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById, getUserById } from "../features/climbing/adapters/staticDataRepository";
import { filterSessions } from "../features/climbing/domain/stats";
import { SessionCard } from "../features/climbing/components/SessionCard";
import { GymFilter } from "../features/climbing/components/GymFilter";
import { UserFilter } from "../features/climbing/components/UserFilter";

interface GradeOption {
  value: string;
  label: string;
  minRank?: number;
  maxRank?: number;
  discipline: "" | "bouldering" | "lead";
}

const GRADE_OPTIONS: GradeOption[] = [
  { value: "", label: "全部难度", discipline: "" },
  // 抱石 V 系
  { value: "v0", label: "V0", minRank: 0, maxRank: 9, discipline: "bouldering" },
  { value: "v1", label: "V1", minRank: 10, maxRank: 19, discipline: "bouldering" },
  { value: "v2", label: "V2", minRank: 20, maxRank: 29, discipline: "bouldering" },
  { value: "v3", label: "V3", minRank: 30, maxRank: 39, discipline: "bouldering" },
  { value: "v4", label: "V4", minRank: 40, maxRank: 49, discipline: "bouldering" },
  { value: "v5", label: "V5+", minRank: 50, maxRank: undefined, discipline: "bouldering" },
  // 难度 5.x 系
  { value: "5.8", label: "5.8", minRank: 800, maxRank: 809, discipline: "lead" },
  { value: "5.9", label: "5.9", minRank: 900, maxRank: 909, discipline: "lead" },
  { value: "5.10a", label: "5.10a", minRank: 1000, maxRank: 1009, discipline: "lead" },
  { value: "5.10b", label: "5.10b", minRank: 1010, maxRank: 1019, discipline: "lead" },
  { value: "5.10c", label: "5.10c", minRank: 1020, maxRank: 1029, discipline: "lead" },
  { value: "5.10d", label: "5.10d", minRank: 1030, maxRank: 1039, discipline: "lead" },
  { value: "5.11a", label: "5.11a", minRank: 1100, maxRank: 1109, discipline: "lead" },
  { value: "5.11b", label: "5.11b", minRank: 1110, maxRank: 1119, discipline: "lead" },
  { value: "5.11c", label: "5.11c", minRank: 1120, maxRank: 1129, discipline: "lead" },
  { value: "5.11d", label: "5.11d", minRank: 1130, maxRank: 1139, discipline: "lead" },
  { value: "5.12a", label: "5.12a", minRank: 1200, maxRank: 1209, discipline: "lead" },
  { value: "5.12b", label: "5.12b", minRank: 1210, maxRank: 1219, discipline: "lead" },
  { value: "5.12c", label: "5.12c", minRank: 1220, maxRank: 1229, discipline: "lead" },
  { value: "5.12d", label: "5.12d", minRank: 1230, maxRank: 1239, discipline: "lead" },
  { value: "5.13a+", label: "5.13a+", minRank: 1300, maxRank: undefined, discipline: "lead" },
];

export function SessionsPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [gymFilter, setGymFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<"" | "bouldering" | "lead">("");
  const [gradeValue, setGradeValue] = useState("");

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  // 难度选项按项目联动：抱石→只显示 V，难度→只显示 5.x，全部→显示全部
  const visibleGradeOptions = useMemo(() => {
    if (disciplineFilter === "") return GRADE_OPTIONS;
    return GRADE_OPTIONS.filter(
      (opt) => opt.discipline === "" || opt.discipline === disciplineFilter,
    );
  }, [disciplineFilter]);

  // 切换项目时，如果当前难度选项不在新列表里，重置为"全部难度"
  useEffect(() => {
    if (!visibleGradeOptions.some((opt) => opt.value === gradeValue)) {
      setGradeValue("");
    }
  }, [visibleGradeOptions, gradeValue]);

  const filteredSessions = useMemo(() => {
    if (!data) return [];
    const filters: Record<string, string | number> = {};
    if (gymFilter) filters.gymId = gymFilter;
    if (userFilter) filters.userId = userFilter;
    if (disciplineFilter) filters.discipline = disciplineFilter;
    const grade = GRADE_OPTIONS.find((opt) => opt.value === gradeValue);
    if (grade) {
      if (grade.minRank !== undefined) filters.minGradeRank = grade.minRank;
      if (grade.maxRank !== undefined) filters.maxGradeRank = grade.maxRank;
    }
    return filterSessions(data, filters as Parameters<typeof filterSessions>[1]);
  }, [data, gymFilter, userFilter, disciplineFilter, gradeValue]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="text-lg font-bold text-stone-100">训练记录</h1>
        <p className="mt-0.5 text-xs text-stone-500">
          显示 {filteredSessions.length} 场训练
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-stone-500">岩馆</p>
        <GymFilter
          gyms={data.gyms}
          activeGymId={gymFilter}
          onSelect={setGymFilter}
        />
      </div>

      {data.users.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-stone-500">攀爬者</p>
          <UserFilter
            users={data.users}
            activeUserId={userFilter}
            onSelect={setUserFilter}
          />
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <p className="mb-1.5 text-xs text-stone-500">项目</p>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value as "" | "bouldering" | "lead")}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-lime-400 focus:outline-none"
          >
            <option value="">全部</option>
            <option value="bouldering">抱石</option>
            <option value="lead">难度</option>
          </select>
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-xs text-stone-500">难度</p>
          <select
            value={gradeValue}
            onChange={(e) => setGradeValue(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-lime-400 focus:outline-none"
          >
            {visibleGradeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSessions.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-500">
            没有符合条件的训练记录。
          </p>
        )}
        {filteredSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            gym={getGymById(data, session.gymId)}
            user={getUserById(data, session.userId)}
          />
        ))}
      </div>
    </div>
  );
}
