import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CategoryRow({ title, children, onSeeAll }) {
  const scroller = useRef(null);
  const scroll = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg md:text-xl font-semibold text-white tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {onSeeAll && (
            <button onClick={onSeeAll} className="text-sm text-teal-400 hover:text-teal-300">See all</button>
          )}
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scroller} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
        {children}
      </div>
    </section>
  );
}
