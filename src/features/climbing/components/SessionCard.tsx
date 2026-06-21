import type { Session, Gym } from "../domain/types";
import { GradePill } from "./GradePill";
import { getSessionEntriesTotal, getSessionDisciplines } from "../domain/stats";
import { TIME_OF_DAY_LABELS } from "../domain/constants";
import { Link } from "react-router-dom";

interface SessionCardProps {
  session: Session;
  gym?: Gym;
}

export function SessionCard({ session, gym }: SessionCardProps) {
  const totalProblems = getSessionEntriesTotal(session.entries);
  const date = new Date(session.climbedAt);
  const dateStr = date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
  const weekDay = date.toLocaleDateString("zh-CN", { weekday: "short" });
  const gymName = gym?.name || session.gymId;
  const timeLabel = TIME_OF_DAY_LABELS[session.timeOfDay] || session.timeOfDay;
  const disciplineLabel = getSessionDisciplines(session.entries);

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block rounded-xl border border-stone-800 bg-stone-900/60 p-4 hover:border-stone-700 hover:bg-stone-900 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-stone-100">
            {gymName}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
            <span>{dateStr} {weekDay}</span>
            <span className="text-stone-100 text-xs">{disciplineLabel}</span>
            {timeLabel && (
              <>
                <span className="text-stone-600">·</span>
                <span>{timeLabel}</span>
              </>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-stone-800 px-2 py-1 text-xs font-medium text-stone-300">
          {totalProblems} 条线
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {session.entries.slice(0, 6).map((entry) => (
          <span
            key={entry.id}
            className="inline-flex items-center gap-1 rounded-md border border-stone-700 bg-stone-800 px-1.5 py-0.5 text-xs text-stone-300"
          >
            <GradePill gradeLabel={entry.gradeLabel} size="sm" />
            {entry.quantity > 1 && (
              <span className="text-stone-500">×{entry.quantity}</span>
            )}
          </span>
        ))}
        {session.entries.length > 6 && (
          <span className="text-xs text-stone-500">
            +{session.entries.length - 6} 更多
          </span>
        )}
      </div>
    </Link>
  );
}
