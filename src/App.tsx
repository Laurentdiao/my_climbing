import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { SessionsPage } from "./pages/SessionsPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { EditorPage } from "./pages/EditorPage";
import { Layout } from "./pages/Layout";

const StatsPage = lazy(() =>
  import("./pages/StatsPage").then((module) => ({ default: module.StatsPage })),
);

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route
          path="/stats"
          element={
            <Suspense fallback={<PageFallback />}>
              <StatsPage />
            </Suspense>
          }
        />
        <Route path="/editor" element={<EditorPage />} />
      </Route>
    </Routes>
  );
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
    </div>
  );
}
