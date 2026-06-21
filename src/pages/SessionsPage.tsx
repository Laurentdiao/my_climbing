import { useState, useEffect, useMemo } from "react";
import type { ClimbingLog } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById } from "../features/climbing/adapters/staticDataRepository";
import { filterSessions } from "../features/climbing/domain/stats";
import { SessionCard } from "../features/climbing/components/SessionCard";
import { GymFilter } from "../features/climbing/components/GymFilter";

const GRADE_OPTIONS = [
  { value: "", label: "全部难度" },
  { value: "0", label: "V0" },
  { value: "1", label: "V1" },
  { value: "2", label: "V2" },
  { value: "3", label: "V3" },
  { value: "4", label: "V4" },
  { value: "5", label: "V5+" },
];

export function SessionsPage() {
  const [data, setData] = useState<ClimbingLog | null>(null);
  const [gymFilter, setGymFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState("");

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  const filteredSessions = useMemo(() => {
    if (!data) return [];
    const filters: Record<string, string | number> = {};
    if (gymFilter) filters.gymId = gymFilter;
    if (gradeFilter) {
      const rank = parseInt(gradeFilter) * 10;
      if (gradeFilter === "5") {
        filters.minGradeRank = 50;
      } else {
        filters.minGradeRank = rank;
        if (rank < 50) {
          filters.maxGradeRank = rank + 9;
        }
      }
    }
    return filterSessions(data, filters as Parameters<typeof filterSessions>[1]);
  }, [data, gymFilter, gradeFilter]);

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

      <div>
        <p className="mb-1.5 text-xs text-stone-500">最低难度</p>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 focus:border-lime-400 focus:outline-none"
        >
          {GRADE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
