import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import CategoryRow from "../components/CategoryRow";
import PosterCard from "../components/PosterCard";
import SkeletonGrid from "../components/SkeletonGrid";
import { useNavigate } from "react-router-dom";
import {
  fetchLiveCategories,
  fetchLiveStreams,
  fetchVodCategories,
  fetchVodStreams,
  fetchSeriesCategories,
  fetchSeries,
  imgProxy,
} from "../lib/api";
import { getHistory, toggleFavorite, isFavorite } from "../lib/storage";
import { Play, Info, Tv, Film, MonitorPlay, Clock } from "lucide-react";

const mapLive = (s) => ({ kind: "live", id: s.stream_id, name: s.name, icon: s.stream_icon });
const mapVod = (s) => ({ kind: "movie", id: s.stream_id, name: s.name, icon: s.stream_icon, rating: s.rating, ext: s.container_extension });
const mapSeries = (s) => ({ kind: "series", id: s.series_id, name: s.name, icon: s.cover, rating: s.rating });

export default function Home() {
  const navigate = useNavigate();
  const [hero, setHero] = useState(null);
  const [movies, setMovies] = useState(null);
  const [series, setSeries] = useState(null);
  const [liveRows, setLiveRows] = useState(null);
  const [, force] = useState(0);

  useEffect(() => {
    // Fetch each section in parallel so UI renders progressively
    (async () => {
      try {
        const liveCats = await fetchLiveCategories();
        const featured = (liveCats || []).slice(0, 2);
        const data = await Promise.all(
          featured.map(async (c) => ({
            cat: c,
            items: ((await fetchLiveStreams(c.category_id).catch(() => [])) || []).slice(0, 20).map(mapLive),
          }))
        );
        setLiveRows(data);
      } catch { setLiveRows([]); }
    })();

    (async () => {
      try {
        const vodCats = await fetchVodCategories();
        const featuredCat = (vodCats || []).find((c) => /4k|english|netflix|latest|2024|2025/i.test(c.category_name)) || (vodCats || [])[0];
        if (!featuredCat) return;
        const v = (await fetchVodStreams(featuredCat.category_id)) || [];
        setMovies({ cat: featuredCat, items: v.slice(0, 20).map(mapVod) });
        const candidate = v.find((x) => x.stream_icon) || v[0];
        if (candidate) setHero({ ...mapVod(candidate), overview: candidate.plot });
      } catch { setMovies({ cat: { category_name: "Movies" }, items: [] }); }
    })();

    (async () => {
      try {
        const sCats = await fetchSeriesCategories();
        const sFeat = (sCats || []).find((c) => /netflix|amazon|hbo|apple/i.test(c.category_name)) || (sCats || [])[0];
        if (!sFeat) return;
        const s = (await fetchSeries(sFeat.category_id)) || [];
        setSeries({ cat: sFeat, items: s.slice(0, 20).map(mapSeries) });
      } catch { setSeries({ cat: { category_name: "Series" }, items: [] }); }
    })();
  }, []);

  const history = getHistory().slice(0, 12);

  const openItem = (it) => {
    if (it.kind === "live") navigate(`/watch/live/${it.id}`);
    else if (it.kind === "movie") navigate(`/movie/${it.id}`);
    else navigate(`/series/${it.id}`);
  };

  return (
    <Layout title="Home">
      {/* Hero */}
      {hero ? (
        <div className="relative h-[55vh] min-h-[360px] w-full rounded-2xl overflow-hidden mb-10 border border-white/5">
          {hero.icon && (
            <img src={imgProxy(hero.icon)} alt={hero.name} className="absolute inset-0 w-full h-full object-cover blur-[1px] scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e12] via-[#0a0e12]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e12] via-transparent to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-8 md:p-12 max-w-3xl">
            <span className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-2">Featured</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">{hero.name}</h2>
            {hero.overview && (
              <p className="text-zinc-300 text-sm md:text-base line-clamp-3 mb-6 max-w-xl">{hero.overview}</p>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/movie/${hero.id}`)} className="flex items-center gap-2 px-6 h-11 bg-teal-400 hover:bg-teal-300 text-black font-semibold rounded-lg transition-colors">
                <Play className="w-4 h-4 fill-black" /> Watch Now
              </button>
              <button onClick={() => navigate(`/movie/${hero.id}`)} className="flex items-center gap-2 px-6 h-11 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg backdrop-blur">
                <Info className="w-4 h-4" /> More Info
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[55vh] min-h-[360px] w-full rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 animate-pulse mb-10" />
      )}

      {/* Quick categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Tv, label: "Live TV", to: "/live", color: "from-rose-500/20 to-rose-500/5" },
          { icon: Film, label: "Movies", to: "/movies", color: "from-teal-500/20 to-teal-500/5" },
          { icon: MonitorPlay, label: "Series", to: "/series", color: "from-violet-500/20 to-violet-500/5" },
          { icon: Clock, label: "Recently Watched", to: "/favorites", color: "from-amber-500/20 to-amber-500/5" },
        ].map(({ icon: Icon, label, to, color }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${color} border border-white/5 hover:border-white/15 hover:scale-[1.02] transition-all text-left`}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-medium">{label}</span>
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <CategoryRow title="Continue Watching">
          {history.map((it) => (
            <div key={`${it.kind}-${it.id}`} className="w-[180px] shrink-0 snap-start">
              <PosterCard item={it} onClick={() => openItem(it)} />
            </div>
          ))}
        </CategoryRow>
      )}

      {movies ? (
        <CategoryRow title={movies.cat.category_name} onSeeAll={() => navigate("/movies")}>
          {movies.items.map((it) => {
            const fav = isFavorite(it.kind, it.id);
            return (
              <div key={it.id} className="w-[180px] shrink-0 snap-start">
                <PosterCard item={it} isFav={fav} onClick={() => openItem(it)} onToggleFav={() => { toggleFavorite(it); force((x) => x + 1); }} />
              </div>
            );
          })}
        </CategoryRow>
      ) : (
        <div className="mb-10"><SkeletonGrid count={7} /></div>
      )}

      {series && series.items.length > 0 && (
        <CategoryRow title={series.cat.category_name} onSeeAll={() => navigate("/series")}>
          {series.items.map((it) => (
            <div key={it.id} className="w-[180px] shrink-0 snap-start">
              <PosterCard item={it} onClick={() => openItem(it)} />
            </div>
          ))}
        </CategoryRow>
      )}

      {liveRows && liveRows.map(({ cat, items }) => items.length > 0 && (
        <CategoryRow key={cat.category_id} title={`Live • ${cat.category_name}`} onSeeAll={() => navigate(`/live?cat=${cat.category_id}`)}>
          {items.map((it) => (
            <div key={it.id} className="w-[280px] shrink-0 snap-start">
              <PosterCard item={it} wide onClick={() => openItem(it)} />
            </div>
          ))}
        </CategoryRow>
      ))}
    </Layout>
  );
}
