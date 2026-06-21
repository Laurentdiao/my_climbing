import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "主页" },
  { to: "/sessions", label: "记录" },
  { to: "/stats", label: "统计" },
];

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-800 bg-stone-950/80 backdrop-blur sm:static">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold tracking-wide text-lime-400">
          Climbing Log
        </span>
        <div className="flex gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
