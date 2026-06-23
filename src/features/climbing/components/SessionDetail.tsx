import type { Session, Gym, User } from "../domain/types";
import { GradePill } from "./GradePill";
import { VideoLink } from "./VideoLink";
import { getSessionEntriesTotal, getSessionDisciplines } from "../domain/stats";
import { TIME_OF_DAY_LABELS } from "../domain/constants";
import { Link } from "react-router-dom";

interface SessionDetailProps {
  session: Session;
  gym?: Gym;
  user?: User;
}

export function SessionDetail({ session, gym, user }: SessionDetailProps) {
  const totalProblems = getSessionEntriesTotal(session.entries);
  const date = new Date(session.climbedAt);
  const dateStr = date.toLocaleDateString("zh-CN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const gymName = gym?.name || session.gymId;
  const timeLabel = TIME_OF_DAY_LABELS[session.timeOfDay] || session.timeOfDay;
  const disciplineLabel = getSessionDisciplines(session.entries);

  return (
    <div>
      <Link
        to="/sessions"
        className="mb-4 inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        返回记录列表
      </Link>

      <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-5">
        <h1 className="text-lg font-bold text-stone-100">{gymName}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-400">
          <span>{dateStr}</span>
          {timeLabel && (
            <>
              <span className="text-stone-600">·</span>
              <span>{timeLabel}</span>
            </>
          )}
          <span className="text-stone-600">·</span>
          <span className="text-xs text-stone-500">{disciplineLabel}</span>
          {user && (
            <>
              <span className="text-stone-600">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: user.color || "#a3e635" }}
                />
                {user.name}
              </span>
            </>
          )}
          <span className="text-stone-600">·</span>
          <span>{session.entries.length} 组 · {totalProblems} 条线路</span>
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
              className="rounded-lg border-l-2 border-l-stone-700 bg-stone-900/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <GradePill gradeLabel={entry.gradeLabel} />
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
