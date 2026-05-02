import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Player from "../components/Player";
import { fetchSeriesInfo, imgProxy } from "../lib/api";
import { toggleFavorite, isFavorite, pushHistory } from "../lib/storage";
import { ArrowLeft, Heart, Star, Play, X, Calendar } from "lucide-react";

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [season, setSeason] = useState(null);
  const [current, setCurrent] = useState(null); // { id, ext, title }
  const [, force] = useState(0);

  useEffect(() => {
    fetchSeriesInfo(id).then((d) => {
      setInfo(d);
      const seasons = Object.keys(d.episodes || {});
      if (seasons.length) setSeason(seasons[0]);
    }).catch(() => setInfo({ info: {} }));
  }, [id]);

  const seasons = useMemo(() => info ? Object.keys(info.episodes || {}).sort((a, b) => Number(a) - Number(b)) : [], [info]);
  const episodes = season && info ? info.episodes[season] || [] : [];

  if (!info) return <Layout title="Series"><div className="animate-pulse h-96 bg-zinc-900 rounded-2xl"/></Layout>;
  const inf = info.info || {};
  const title = inf.name || "Series";
  const cover = inf.cover || inf.cover_big;
  const backdrop = (inf.backdrop_path && inf.backdrop_path[0]) || cover;
  const item = { kind: "series", id, name: title, icon: cover, rating: inf.rating };
  const fav = isFavorite("series", id);

  const playEpisode = (ep) => {
    pushHistory({ ...item, name: `${title} - S${ep.season}E${ep.episode_num}` });
    setCurrent({ id: ep.id, ext: ep.container_extension || "mp4", title: ep.title || `Episode ${ep.episode_num}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout title="Series">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {current ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-black">
          <Player kind="series" streamId={current.id} ext={current.ext} poster={cover ? imgProxy(cover) : undefined} />
          <button onClick={() => setCurrent(null)} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center z-10">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-3 left-4 text-white text-sm bg-black/50 backdrop-blur px-3 py-1 rounded">
            {current.title}
          </div>
        </div>
      ) : (
        <div className="relative w-full h-[50vh] min-h-[320px] rounded-2xl overflow-hidden mb-6">
          {backdrop && <img src={imgProxy(backdrop)} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e12] via-[#0a0e12]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e12] via-transparent to-transparent" />
          <div className="relative h-full flex items-end p-8 gap-6">
            {cover && <img src={imgProxy(cover)} alt={title} className="hidden md:block w-44 aspect-[2/3] object-cover rounded-xl border border-white/10 shadow-2xl" />}
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{title}</h1>
              <div className="flex items-center gap-4 text-sm text-zinc-300 mb-4 flex-wrap">
                {inf.rating && <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" />{parseFloat(inf.rating).toFixed(1)}</span>}
                {inf.releaseDate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{inf.releaseDate}</span>}
                {inf.genre && <span className="text-teal-400">{inf.genre}</span>}
              </div>
              <button onClick={() => { toggleFavorite(item); force((x) => x + 1); }} className={`flex items-center gap-2 px-5 h-11 rounded-lg font-medium border ${fav ? "bg-teal-500/15 border-teal-400 text-teal-300" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
                <Heart className={`w-4 h-4 ${fav ? "fill-teal-400" : ""}`} /> {fav ? "Favorited" : "Favorite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {inf.plot && <p className="text-zinc-400 leading-relaxed mb-8 max-w-3xl">{inf.plot}</p>}

      {/* Seasons */}
      {seasons.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {seasons.map((s) => (
            <button key={s} onClick={() => setSeason(s)} className={`px-4 h-9 rounded-lg text-sm font-medium whitespace-nowrap ${
              season === s ? "bg-teal-400 text-black" : "bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}>Season {s}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {episodes.map((ep) => {
          const img = ep.info?.movie_image || cover;
          return (
            <button key={ep.id} onClick={() => playEpisode(ep)} className="group flex gap-3 p-3 bg-[#0f141a] border border-white/5 rounded-xl hover:border-teal-400/40 text-left transition-all">
              <div className="w-32 aspect-video rounded-md overflow-hidden bg-black shrink-0 relative">
                {img && <img src={imgProxy(img)} alt={ep.title} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-teal-400 mb-1">Episode {ep.episode_num}</div>
                <div className="text-white font-medium truncate">{ep.title}</div>
                {ep.info?.plot && <div className="text-xs text-zinc-400 line-clamp-2 mt-1">{ep.info.plot}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </Layout>
  );
}
