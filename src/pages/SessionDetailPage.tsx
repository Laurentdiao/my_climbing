import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { ClimbingLog } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";
import { getGymById, getUserById } from "../features/climbing/adapters/staticDataRepository";
import { getSessionById } from "../features/climbing/domain/stats";
import { SessionDetail } from "../features/climbing/components/SessionDetail";

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<ClimbingLog | null>(null);

  useEffect(() => {
    loadClimbingLog().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
      </div>
    );
  }

  const session = sessionId ? getSessionById(data, sessionId) : undefined;

  if (!session) {
    return (
      <div className="py-20 text-center">
          <p className="text-stone-400">未找到该场训练记录。</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <SessionDetail
        session={session}
        gym={getGymById(data, session.gymId)}
        user={getUserById(data, session.userId)}
      />
    </div>
  );
}
