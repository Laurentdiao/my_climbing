import { useState, useEffect, useMemo } from "react";
import type { ClimbingLog } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById } from "../features/climbing/adapters/staticDataRepository";
import { filterSessions } from "../features/climbing/domain/stats";
import { SessionCard } from "../features/climbing/components/SessionCard";
import { GymFilter } from "../features/climbing/components/GymFilter";

const GRADE_OPTIONS = [
  { value: "", label: "全部难度", minRank: undefined, maxRank: undefined },
  { value: "v0", label: "V0", minRank: 0, maxRank: 9 },
  { value: "v1", label: "V1", minRank: 10, maxRank: 19 },
  { value: "v2", label: "V2", minRank: 20, maxRank: 29 },
  { value: "v3", label: "V3", minRank: 30, maxRank: 39 },
  { value: "v4", label: "V4", minRank: 40, maxRank: 49 },
  { value: "v5", label: "V5+", minRank: 50, maxRank: undefined },
  { value: "5.8", label: "5.8", minRank: 800, maxRank: 809 },
  { value: "5.9", label: "5.9", minRank: 900, maxRank: 909 },
  { value: "5.10a", label: "5.10a", minRank: 1000, maxRank: 1009 },
  { value: "5.10b", label: "5.10b", minRank: 1010, maxRank: 1019 },
  { value: "5.10c", label: "5.10c", minRank: 1020, maxRank: 1029 },
  { value: "5.10d", label: "5.10d", minRank: 1030, maxRank: 1039 },
  { value: "5.11a", label: "5.11a", minRank: 1100, maxRank: 1109 },
  { value: "5.11b", label: "5.11b", minRank: 1110, maxRank: 1119 },
  { value: "5.11c", label: "5.11c", minRank: 1120, maxRank: 1129 },
  { value: "5.11d", label: "5.11d", minRank: 1130, maxRank: 1139 },
  { value: "5.12a", label: "5.12a", minRank: 1200, maxRank: 1209 },
  { value: "5.12b", label: "5.12b", minRank: 1210, maxRank: 1219 },
  { value: "5.12c", label: "5.12c", minRank: 1220, maxRank: 1229 },
  { value: "5.12d", label: "5.12d", minRank: 1230, maxRank: 1239 },
  { value: "5.13a+", label: "5.13a+", minRank: 1300, maxRank: undefined },
];

export function SessionsPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [gymFilter, setGymFilter] = useState<string | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [gradeIdx, setGradeIdx] = useState(0);

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  const filteredSessions = useMemo(() => {
    if (!data) return [];
    const filters: Record<string, string | number> = {};
    if (gymFilter) filters.gymId = gymFilter;
    if (disciplineFilter) filters.discipline = disciplineFilter;
    const grade = GRADE_OPTIONS[gradeIdx];
    if (grade.minRank !== undefined) filters.minGradeRank = grade.minRank;
    if (grade.maxRank !== undefined) filters.maxGradeRank = grade.maxRank;
    return filterSessions(data, filters as Parameters<typeof filterSessions>[1]);
  }, [data, gymFilter, disciplineFilter, gradeIdx]);

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

      <div className="flex gap-3">
        <div className="flex-1">
          <p className="mb-1.5 text-xs text-stone-500">项目</p>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
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
            value={gradeIdx}
            onChange={(e) => setGradeIdx(parseInt(e.target.value))}
            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-lime-400 focus:outline-none"
          >
            {GRADE_OPTIONS.map((opt, i) => (
              <option key={opt.value} value={i}>
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
          />
        ))}
      </div>
    </div>
  );
}
