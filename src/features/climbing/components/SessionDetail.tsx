import type { Session, Gym } from "../domain/types";
import { GradePill } from "./GradePill";
import { VideoLink } from "./VideoLink";
import { getSessionEntriesTotal } from "../domain/stats";
import { Link } from "react-router-dom";

interface SessionDetailProps {
  session: Session;
  gym?: Gym;
}

const resultLabels: Record<string, string> = {
  flash: "Flash",
  sent: "Sent",
  repeat: "Repeat",
  attempted: "Attempted",
  project: "Project",
};

const resultStyles: Record<string, string> = {
  flash: "border-l-cyan-500 bg-cyan-950/30",
  sent: "border-l-green-500 bg-green-950/30",
  repeat: "border-l-blue-500 bg-blue-950/30",
  attempted: "border-l-yellow-500 bg-yellow-950/30",
  project: "border-l-purple-500 bg-purple-950/30",
};

export function SessionDetail({ session, gym }: SessionDetailProps) {
  const totalProblems = getSessionEntriesTotal(session.entries);
  const date = new Date(session.climbedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <Link
        to="/sessions"
        className="mb-4 inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to sessions
      </Link>

      <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-5">
        <h1 className="text-lg font-bold text-stone-100">
          {session.title || `Session · ${dateStr}`}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-400">
          <span>{dateStr}</span>
          {gym && (
            <>
              <span className="text-stone-600">·</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: gym.color || "#a3e635" }}
                />
                {gym.name}
                {gym.city && <span className="text-stone-500">· {gym.city}</span>}
              </span>
            </>
          )}
          <span className="text-stone-600">·</span>
          <span className="uppercase text-xs tracking-wider text-stone-500">
            {session.discipline}
          </span>
          <span className="text-stone-600">·</span>
          <span>{session.entries.length} lines · {totalProblems} problems</span>
        </div>

        {session.notes && (
          <p className="mt-3 text-sm text-stone-400 leading-relaxed">
            {session.notes}
          </p>
        )}

        <div className="mt-5 space-y-2">
          {session.entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border-l-2 p-3 ${resultStyles[entry.result] ?? "border-l-stone-700 bg-stone-900/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <GradePill gradeLabel={entry.gradeLabel} />
                <span className="text-xs font-medium text-stone-300">
                  {resultLabels[entry.result]}
                </span>
                {entry.attempts !== null && entry.attempts > 0 && (
                  <span className="text-xs text-stone-500">
                    {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}
                  </span>
                )}
                {entry.quantity > 1 && (
                  <span className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-400">
                    ×{entry.quantity}
                  </span>
                )}
              </div>

              {entry.notes && (
                <p className="mt-1.5 text-xs text-stone-500">{entry.notes}</p>
              )}

              {entry.videoUrl && (
                <div className="mt-2">
                  <VideoLink
                    url={entry.videoUrl}
                    platform={entry.videoPlatform}
                    title={entry.videoTitle}
                  />
                  {entry.quantity > 1 && (
                    <span className="ml-2 text-xs text-stone-600">
                      (related video, not per-problem)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
