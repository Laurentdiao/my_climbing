import { useParams } from "react-router-dom";

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return (
    <div className="py-8 text-center text-stone-400">
      Session: {sessionId}
    </div>
  );
}
