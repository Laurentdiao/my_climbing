import type { Session, Gym, User } from "../domain/types";
import { GradePill } from "./GradePill";
import { getSessionEntriesTotal, getSessionDisciplines } from "../domain/stats";
import { TIME_OF_DAY_LABELS } from "../domain/constants";
import { Link } from "react-router-dom";

interface SessionCardProps {
  session: Session;
  gym?: Gym;
  user?: User;
}

export function SessionCard({ session, gym, user }: SessionCardProps) {
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
      className="block rounded-2xl border border-stone-800/90 bg-stone-900/70 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.18)] hover:border-lime-800/80 hover:bg-stone-900 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-stone-100">
            {gymName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-400">
            {user && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: user.color || "#a3e635" }}
                />
                {user.name}
              </span>
            )}
            <span>{dateStr} {weekDay}</span>
            <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-200">{disciplineLabel}</span>
            {timeLabel && (
              <>
                <span>{timeLabel}</span>
              </>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-lime-400/12 px-2.5 py-1 text-xs font-semibold text-lime-300 ring-1 ring-lime-400/15">
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
