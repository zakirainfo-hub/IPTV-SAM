import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PosterCard from "../components/PosterCard";
import SkeletonGrid from "../components/SkeletonGrid";
import { fetchVodCategories, fetchVodStreams } from "../lib/api";
import { toggleFavorite, isFavorite } from "../lib/storage";

export default function Movies() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [streams, setStreams] = useState(null);
  const [filter, setFilter] = useState("");
  const [, force] = useState(0);
  const selectedCat = sp.get("cat") || "";

  useEffect(() => {
    fetchVodCategories().then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    setStreams(null);
    const cat = selectedCat || (cats[0] && cats[0].category_id);
    if (!cat) return;
    fetchVodStreams(cat).then((list) => setStreams(list || [])).catch(() => setStreams([]));
  }, [selectedCat, cats]);

  const filtered = useMemo(() => {
    if (!streams) return null;
    const q = filter.trim().toLowerCase();
    return q ? streams.filter((s) => (s.name || "").toLowerCase().includes(q)) : streams;
  }, [streams, filter]);

  const activeCat = cats.find((c) => String(c.category_id) === String(selectedCat)) || cats[0];

  return (
    <Layout title="Movies">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="bg-[#0f141a] border border-white/5 rounded-xl p-2 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="px-3 py-2 text-xs uppercase tracking-wider text-zinc-500">Genres</div>
            {cats.map((c) => (
              <button
                key={c.category_id}
                onClick={() => setSp({ cat: c.category_id })}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                  String(activeCat?.category_id) === String(c.category_id)
                    ? "bg-teal-500/15 text-teal-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
                title={c.category_name}
              >
                {c.category_name}
              </button>
            ))}
          </div>
        </aside>
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{activeCat?.category_name || "Movies"}</h2>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="bg-white/5 border border-white/10 rounded-md h-9 px-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-teal-500/60 w-60"
            />
          </div>
          {!filtered ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <div className="text-zinc-400 text-center py-20">No movies found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.slice(0, 200).map((s) => {
                const item = { kind: "movie", id: s.stream_id, name: s.name, icon: s.stream_icon, rating: s.rating, ext: s.container_extension };
                const fav = isFavorite("movie", item.id);
                return (
                  <PosterCard
                    key={s.stream_id}
                    item={item}
                    isFav={fav}
                    onClick={() => navigate(`/movie/${item.id}`)}
                    onToggleFav={() => { toggleFavorite(item); force((x) => x + 1); }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
