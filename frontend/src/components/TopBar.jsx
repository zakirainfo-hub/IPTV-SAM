import React, { useEffect, useState } from "react";
import { Search, Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { getProfile } from "../lib/storage";

export default function TopBar({ title }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [time, setTime] = useState(new Date());
  const [profile] = useState(getProfile());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-6 px-8 bg-[#0a0e12]/80 backdrop-blur border-b border-white/5">
      <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
      <form onSubmit={onSubmit} className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movies, shows, channels..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-10 focus-visible:ring-teal-500/40"
        />
      </form>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400 hidden md:block tabular-nums">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <span className="mx-2 text-zinc-600">•</span>
          {time.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" })}
        </span>
        <button className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
          <span className="text-sm text-white hidden md:inline">{profile.name}</span>
        </div>
      </div>
    </header>
  );
}
