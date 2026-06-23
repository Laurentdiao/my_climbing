import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import type { ClimbingLog } from "../features/climbing/domain/types";
import { loadClimbingLog } from "../features/climbing/adapters/staticDataRepository";

const links = [
  { to: "/", label: "主页" },
  { to: "/sessions", label: "记录" },
  { to: "/stats", label: "统计" },
  { to: "/editor", label: "编辑" },
];

export function NavBar() {
  const [siteTitle, setSiteTitle] = useState("Climbing Log");

  useEffect(() => {
    loadClimbingLog().then((data: ClimbingLog) => {
      if (data.siteTitle) setSiteTitle(data.siteTitle);
    });
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-800/80 bg-stone-950/85 shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur sm:static">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => window.location.reload()}
          className="shrink-0 text-sm font-semibold tracking-wide text-lime-300 hover:text-lime-200"
        >
          {siteTitle}
        </button>
        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-stone-800 bg-stone-900/55 p-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-lime-400 text-stone-950 shadow-sm"
                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
