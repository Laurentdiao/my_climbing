import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";

export function Layout() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <NavBar />
      <main className="flex-1 px-3 py-4 pb-24 sm:px-4 sm:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
