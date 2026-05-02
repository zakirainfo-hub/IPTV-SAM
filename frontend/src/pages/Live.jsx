import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PosterCard from "../components/PosterCard";
import SkeletonGrid from "../components/SkeletonGrid";
import { fetchLiveCategories, fetchLiveStreams, fetchShortEpg, decodeEpg } from "../lib/api";
import { Tv, Radio } from "lucide-react";

export default function Live() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [streams, setStreams] = useState(null);
  const selectedCat = sp.get("cat") || "";
  const [filter, setFilter] = useState("");
  const [epgMap, setEpgMap] = useState({});

  useEffect(() => {
    fetchLiveCategories().then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    setStreams(null);
    setEpgMap({});
    const cat = selectedCat || (cats[0] && cats[0].category_id);
    if (!cat) return;
    fetchLiveStreams(cat).then((list) => setStreams(list || [])).catch(() => setStreams([]));
  }, [selectedCat, cats]);

  // Fetch EPG for first 20 visible streams
  useEffect(() => {
    if (!streams) return;
    streams.slice(0, 20).forEach(async (s) => {
      try {
        const res = await fetchShortEpg(s.stream_id);
        const listings = (res && res.epg_listings) || [];
        if (listings.length) {
          setEpgMap((m) => ({ ...m, [s.stream_id]: listings }));
        }
      } catch {}
    });
  }, [streams]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!streams) return null;
    return q ? streams.filter((s) => (s.name || "").toLowerCase().includes(q)) : streams;
  }, [streams, filter]);

  const activeCat = cats.find((c) => String(c.category_id) === String(selectedCat)) || cats[0];

  return (
    <Layout title="Live TV">
      <div className="grid grid-cols-12 gap-6">
        {/* Categories sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="bg-[#0f141a] border border-white/5 rounded-xl p-2 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider text-zinc-500">
              <Radio className="w-3 h-3" /> Categories
            </div>
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

        {/* Channel list with EPG */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold">{activeCat?.category_name || "Channels"}</h2>
            <span className="text-xs text-zinc-500">{filtered?.length || 0} channels</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter channels..."
              className="ml-auto bg-white/5 border border-white/10 rounded-md h-9 px-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-teal-500/60 w-60"
            />
          </div>

          {!filtered ? (
            <SkeletonGrid count={12} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">No channels found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((s) => {
                const epg = epgMap[s.stream_id] || [];
                const now = epg[0];
                const next = epg[1];
                return (
                  <button
                    key={s.stream_id}
                    onClick={() => navigate(`/watch/live/${s.stream_id}`)}
                    className="group flex items-center gap-3 p-3 bg-[#0f141a] border border-white/5 rounded-xl hover:border-teal-400/40 hover:bg-[#131a22] transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-lg bg-black/40 flex items-center justify-center shrink-0 overflow-hidden">
                      {s.stream_icon ? (
                        <img src={`${process.env.REACT_APP_BACKEND_URL}/api/img?url=${encodeURIComponent(s.stream_icon)}`} alt={s.name} className="w-full h-full object-contain" onError={(e)=>{e.currentTarget.style.display='none';}}/>
                      ) : (
                        <Tv className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{s.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">LIVE</span>
                      </div>
                      {now ? (
                        <div className="mt-1 text-xs text-zinc-400 truncate">
                          <span className="text-teal-400">Now:</span> {decodeEpg(now.title) || "--"}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-zinc-600">No EPG</div>
                      )}
                      {next && (
                        <div className="text-xs text-zinc-500 truncate">
                          <span className="text-zinc-400">Next:</span> {decodeEpg(next.title) || "--"}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
