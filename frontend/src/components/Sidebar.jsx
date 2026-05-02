import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Tv, Film, MonitorPlay, Search, Heart, Settings, Compass } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/live", icon: Tv, label: "Live TV" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/series", icon: MonitorPlay, label: "Series" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="group fixed left-0 top-0 h-screen z-40 bg-[#0b0f14] border-r border-white/5 transition-all duration-300 w-[72px] hover:w-[232px] overflow-hidden">
      <div className="flex items-center gap-3 h-16 px-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5 text-black" />
        </div>
        <span className="text-white font-semibold text-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          OTT <span className="text-teal-400">Navigator</span>
        </span>
      </div>
      <nav className="py-4 flex flex-col gap-1 px-3">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-4 h-11 px-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-teal-500/15 text-teal-300"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
