import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Player from "../components/Player";
import { fetchVodInfo, imgProxy } from "../lib/api";
import { toggleFavorite, isFavorite, pushHistory } from "../lib/storage";
import { ArrowLeft, Heart, Star, Clock, Calendar, Play, X } from "lucide-react";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    fetchVodInfo(id).then(setInfo).catch(() => setInfo({}));
  }, [id]);

  if (!info) return <Layout title="Movie"><div className="animate-pulse h-96 bg-zinc-900 rounded-2xl"/></Layout>;

  const mi = info.movie_data || {};
  const inf = info.info || {};
  const ext = mi.container_extension || "mp4";
  const title = mi.name || inf.name || "Movie";
  const cover = inf.movie_image || inf.cover_big || mi.stream_icon;
  const backdrop = (inf.backdrop_path && inf.backdrop_path[0]) || cover;
  const item = { kind: "movie", id: mi.stream_id || id, name: title, icon: cover, rating: inf.rating, ext };
  const fav = isFavorite("movie", item.id);

  const onPlay = () => {
    pushHistory(item);
    setPlaying(true);
  };

  return (
    <Layout title="Movie">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {playing ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-black">
          <Player kind="movie" streamId={item.id} ext={ext} poster={cover ? imgProxy(cover) : undefined} />
          <button onClick={() => setPlaying(false)} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center z-10">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        <div className="relative w-full h-[50vh] min-h-[360px] rounded-2xl overflow-hidden mb-6">
          {backdrop && <img src={imgProxy(backdrop)} alt={title} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e12] via-[#0a0e12]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e12] via-transparent to-transparent" />
          <div className="relative h-full flex items-end p-8 gap-6">
            {cover && <img src={imgProxy(cover)} alt={title} className="hidden md:block w-48 aspect-[2/3] object-cover rounded-xl border border-white/10 shadow-2xl" />}
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{title}</h1>
              <div className="flex items-center flex-wrap gap-4 text-sm text-zinc-300 mb-4">
                {inf.rating && <span className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" />{parseFloat(inf.rating).toFixed(1)}</span>}
                {inf.releasedate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{inf.releasedate}</span>}
                {inf.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{inf.duration}</span>}
                {inf.genre && <span className="text-teal-400">{inf.genre}</span>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onPlay} className="flex items-center gap-2 px-6 h-11 bg-teal-400 hover:bg-teal-300 text-black font-semibold rounded-lg">
                  <Play className="w-4 h-4 fill-black" /> Play
                </button>
                <button onClick={() => { toggleFavorite(item); force((x) => x + 1); }} className={`flex items-center gap-2 px-5 h-11 rounded-lg font-medium border ${fav ? "bg-teal-500/15 border-teal-400 text-teal-300" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
                  <Heart className={`w-4 h-4 ${fav ? "fill-teal-400" : ""}`} /> {fav ? "Favorited" : "Favorite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-3">Plot</h3>
          <p className="text-zinc-400 leading-relaxed">{inf.plot || inf.description || "No description available."}</p>
        </div>
        <div className="space-y-3 text-sm">
          {inf.cast && <div><span className="text-zinc-500">Cast: </span><span className="text-zinc-200">{inf.cast}</span></div>}
          {inf.director && <div><span className="text-zinc-500">Director: </span><span className="text-zinc-200">{inf.director}</span></div>}
          {inf.country && <div><span className="text-zinc-500">Country: </span><span className="text-zinc-200">{inf.country}</span></div>}
          {inf.genre && <div><span className="text-zinc-500">Genre: </span><span className="text-zinc-200">{inf.genre}</span></div>}
        </div>
      </div>
    </Layout>
  );
}
