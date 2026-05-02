import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Player from "../components/Player";
import Sidebar from "../components/Sidebar";
import { fetchLiveStreams, fetchShortEpg, fetchLiveCategories, decodeEpg, imgProxy } from "../lib/api";
import { ArrowLeft, Heart, Tv } from "lucide-react";
import { toggleFavorite, isFavorite, pushHistory } from "../lib/storage";

export default function Watch() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [relatedChannels, setRelatedChannels] = useState([]);
  const [epg, setEpg] = useState([]);
  const [, force] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cats = await fetchLiveCategories().catch(() => []);
      // find category containing this stream - search several popular cats first
      for (const c of cats) {
        const list = await fetchLiveStreams(c.category_id).catch(() => []);
        const match = (list || []).find((s) => String(s.stream_id) === String(id));
        if (match) {
          if (cancelled) return;
          setChannel({ ...match, category_name: c.category_name });
          setRelatedChannels((list || []).filter((x) => String(x.stream_id) !== String(id)).slice(0, 40));
          pushHistory({ kind: "live", id: match.stream_id, name: match.name, icon: match.stream_icon });
          break;
        }
      }
    })();
    fetchShortEpg(id).then((res) => setEpg((res && res.epg_listings) || [])).catch(() => setEpg([]));
    return () => { cancelled = true; };
  }, [id]);

  const favItem = channel ? { kind: "live", id: channel.stream_id, name: channel.name, icon: channel.stream_icon } : null;
  const fav = favItem ? isFavorite("live", favItem.id) : false;

  return (
    <div className="min-h-screen bg-[#0a0e12] text-white">
      <Sidebar />
      <div className="pl-[72px]">
        <div className="p-6">
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black mb-4">
                <Player kind="live" streamId={id} ext="ts" />
              </div>
              {channel && (
                <div className="flex items-start gap-4 p-4 bg-[#0f141a] border border-white/5 rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                    {channel.stream_icon ? <img src={imgProxy(channel.stream_icon)} alt={channel.name} className="w-full h-full object-contain" /> : <Tv className="w-6 h-6 text-zinc-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-white">{channel.name}</h1>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">LIVE</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{channel.category_name}</p>
                  </div>
                  <button onClick={() => { toggleFavorite(favItem); force((x) => x + 1); }} className={`px-4 h-10 rounded-lg flex items-center gap-2 border ${fav ? "bg-teal-500/15 border-teal-400 text-teal-300" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
                    <Heart className={`w-4 h-4 ${fav ? "fill-teal-400" : ""}`} /> {fav ? "Saved" : "Favorite"}
                  </button>
                </div>
              )}
              {epg.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Program Guide</h3>
                  <div className="space-y-2">
                    {epg.map((e, i) => {
                      const start = new Date((parseInt(e.start_timestamp, 10) || 0) * 1000);
                      const stop = new Date((parseInt(e.stop_timestamp, 10) || 0) * 1000);
                      const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={i} className={`p-3 rounded-lg border ${i === 0 ? "bg-teal-500/10 border-teal-400/30" : "bg-[#0f141a] border-white/5"}`}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-zinc-500 tabular-nums">{fmt(start)} - {fmt(stop)}</span>
                            {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-400 text-black font-bold">NOW</span>}
                          </div>
                          <div className="text-white font-medium mt-1">{decodeEpg(e.title)}</div>
                          {e.description && <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{decodeEpg(e.description)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <aside className="col-span-12 lg:col-span-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">More Channels</h3>
              <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
                {relatedChannels.map((s) => (
                  <button key={s.stream_id} onClick={() => navigate(`/watch/live/${s.stream_id}`)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left">
                    <div className="w-10 h-10 rounded bg-black/30 flex items-center justify-center overflow-hidden shrink-0">
                      {s.stream_icon ? <img src={imgProxy(s.stream_icon)} alt={s.name} className="w-full h-full object-contain" /> : <Tv className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <span className="text-sm text-white truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
