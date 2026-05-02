import React, { useState } from "react";
import { Play, Heart, Star } from "lucide-react";
import { imgProxy } from "../lib/api";

export default function PosterCard({ item, onClick, onToggleFav, isFav, wide = false, className = "" }) {
  const [err, setErr] = useState(false);
  const src = item.icon ? imgProxy(item.icon) : null;
  const rating = item.rating;
  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer rounded-xl overflow-hidden bg-[#141a21] border border-white/5 hover:border-teal-400/60 transition-all duration-300 hover:scale-[1.04] hover:z-10 hover:shadow-2xl hover:shadow-teal-500/10 ${wide ? "aspect-video" : "aspect-[2/3]"} ${className}`}
    >
      {src && !err ? (
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          onError={() => setErr(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-3 text-center">
          <span className="text-sm text-zinc-300 font-medium line-clamp-4">{item.name}</span>
        </div>
      )}

      {onToggleFav && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur bg-black/50 hover:bg-black/70 flex items-center justify-center transition-opacity ${isFav ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-teal-400 text-teal-400" : "text-white"}`} />
        </button>
      )}

      {rating && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-xs text-yellow-400">
          <Star className="w-3 h-3 fill-yellow-400" />
          {parseFloat(rating).toFixed(1)}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-teal-400 flex items-center justify-center">
            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
          </div>
          <span className="text-white text-sm font-medium line-clamp-1">{item.name}</span>
        </div>
      </div>
    </div>
  );
}
