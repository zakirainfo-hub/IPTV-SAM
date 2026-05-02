import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PosterCard from "../components/PosterCard";
import { search as searchApi } from "../lib/api";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const q = sp.get("q") || "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults(null); return; }
    setLoading(true);
    searchApi(q).then(setResults).catch(() => setResults({ live: [], vod: [], series: [] })).finally(() => setLoading(false));
  }, [q]);

  const submit = (e) => { e.preventDefault(); setSp(input ? { q: input } : {}); };

  const total = results ? results.live.length + results.vod.length + results.series.length : 0;

  return (
    <Layout title="Search">
      <form onSubmit={submit} className="relative max-w-2xl mb-8">
        <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search across movies, series & channels..."
          className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 outline-none focus:border-teal-500/60" />
      </form>

      {!q && <div className="text-zinc-500 text-center py-20">Start typing to search...</div>}
      {loading && <div className="text-zinc-400 text-center py-20">Searching...</div>}
      {results && !loading && total === 0 && <div className="text-zinc-500 text-center py-20">No results for “{q}”</div>}

      {results && results.vod.length > 0 && (
        <Section title={`Movies (${results.vod.length})`}>
          {results.vod.map((s) => (
            <PosterCard key={s.stream_id} item={{ kind: "movie", id: s.stream_id, name: s.name, icon: s.stream_icon, rating: s.rating }} onClick={() => navigate(`/movie/${s.stream_id}`)} />
          ))}
        </Section>
      )}
      {results && results.series.length > 0 && (
        <Section title={`Series (${results.series.length})`}>
          {results.series.map((s) => (
            <PosterCard key={s.series_id} item={{ kind: "series", id: s.series_id, name: s.name, icon: s.cover, rating: s.rating }} onClick={() => navigate(`/series/${s.series_id}`)} />
          ))}
        </Section>
      )}
      {results && results.live.length > 0 && (
        <Section title={`Live TV (${results.live.length})`} wide>
          {results.live.map((s) => (
            <PosterCard wide key={s.stream_id} item={{ kind: "live", id: s.stream_id, name: s.name, icon: s.stream_icon }} onClick={() => navigate(`/watch/live/${s.stream_id}`)} />
          ))}
        </Section>
      )}
    </Layout>
  );
}

function Section({ title, children, wide = false }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className={`grid gap-4 ${wide ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-3 md:grid-cols-5 lg:grid-cols-7"}`}>
        {children}
      </div>
    </div>
  );
}
