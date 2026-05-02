import React from "react";

export default function Skeleton({ aspect = "2/3", count = 12, wide = false }) {
  return (
    <div className={`grid gap-4 ${wide ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-3 md:grid-cols-5 lg:grid-cols-7"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ aspectRatio: aspect }}
          className="rounded-xl bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 animate-pulse"
        />
      ))}
    </div>
  );
}
