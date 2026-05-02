import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PosterCard from "../components/PosterCard";
import { getFavorites, toggleFavorite } from "../lib/storage";
import { Heart } from "lucide-react";

export default function Favorites() {
  const navigate = useNavigate();
  const [, force] = useState(0);
  const list = getFavorites();
  const groups = {
    movie: list.filter((x) => x.kind === "movie"),
    series: list.filter((x) => x.kind === "series"),
    live: list.filter((x) => x.kind === "live"),
  };

  const open = (it) => {
    if (it.kind === "live") navigate(`/watch/live/${it.id}`);
    else if (it.kind === "movie") navigate(`/movie/${it.id}`);
    else navigate(`/series/${it.id}`);
  };

  return (
    <Layout title="Favorites">
      {list.length === 0 && (
        <div className="text-center py-24">
          <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">No favorites yet. Tap the heart on any title to save it.</p>
        </div>
      )}
      {Object.entries(groups).map(([k, items]) => items.length > 0 && (
        <div key={k} className="mb-10">
          <h2 className="text-lg font-semibold mb-4 capitalize">{k === "live" ? "Live Channels" : k === "movie" ? "Movies" : "Series"}</h2>
          <div className={`grid gap-4 ${k === "live" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-3 md:grid-cols-5 lg:grid-cols-6"}`}>
            {items.map((it) => (
              <PosterCard key={`${it.kind}-${it.id}`} item={it} wide={it.kind === "live"} isFav onClick={() => open(it)} onToggleFav={() => { toggleFavorite(it); force((x) => x + 1); }} />
            ))}
          </div>
        </div>
      ))}
    </Layout>
  );
}
