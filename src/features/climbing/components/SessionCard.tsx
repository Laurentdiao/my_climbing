import type { Session, Gym } from "../domain/types";
import { GradePill } from "./GradePill";
import { getSessionEntriesTotal } from "../domain/stats";
import { Link } from "react-router-dom";

interface SessionCardProps {
  session: Session;
  gym?: Gym;
}

const resultLabels: Record<string, string> = {
  flash: "FLASH",
  sent: "SENT",
  repeat: "REPEAT",
  attempted: "ATTEMPT",
  project: "PROJECT",
};

const resultStyles: Record<string, string> = {
  flash: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  sent: "bg-green-900/50 text-green-300 border-green-700",
  repeat: "bg-blue-900/50 text-blue-300 border-blue-700",
  attempted: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  project: "bg-purple-900/50 text-purple-300 border-purple-700",
};

export function SessionCard({ session, gym }: SessionCardProps) {
  const totalProblems = getSessionEntriesTotal(session.entries);
  const date = new Date(session.climbedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="block rounded-xl border border-stone-800 bg-stone-900/60 p-4 hover:border-stone-700 hover:bg-stone-900 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-stone-100">
              {session.title || `Session · ${dateStr}`}
            </h3>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
            <span>{dateStr}</span>
            {gym && (
              <>
                <span className="text-stone-600">·</span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: gym.color || "#a3e635" }}
                  />
                  {gym.name}
                </span>
              </>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-stone-800 px-2 py-1 text-xs font-medium text-stone-300">
          {totalProblems} probs
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {session.entries.slice(0, 6).map((entry) => (
          <span
            key={entry.id}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${resultStyles[entry.result] ?? "border-stone-700 bg-stone-800 text-stone-300"}`}
          >
            <GradePill gradeLabel={entry.gradeLabel} size="sm" />
            <span className="opacity-70">
              {resultLabels[entry.result] ?? entry.result}
            </span>
            {entry.quantity > 1 && (
              <span className="text-stone-500">×{entry.quantity}</span>
            )}
          </span>
        ))}
        {session.entries.length > 6 && (
          <span className="text-xs text-stone-500">
            +{session.entries.length - 6} more
          </span>
        )}
      </div>
    </Link>
  );
}
