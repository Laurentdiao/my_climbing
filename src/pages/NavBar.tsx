import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "主页" },
  { to: "/sessions", label: "记录" },
  { to: "/stats", label: "统计" },
  { to: "/editor", label: "编辑" },
];

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-800 bg-stone-950/80 backdrop-blur sm:static">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-semibold tracking-wide text-lime-400 hover:text-lime-300 active:scale-95 transition-all"
        >
          Climbing Log
        </button>
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-lime-400/15 text-lime-400"
                    : "text-stone-400 hover:text-stone-200"
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
