import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API, timeout: 45000 });

export const imgProxy = (url) => {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  return `${API}/img?url=${encodeURIComponent(url)}`;
};

export const streamUrl = (kind, id, ext = "ts") =>
  `${API}/stream/${kind}/${id}?ext=${ext}`;

// API helpers with caching in memory (session)
const cache = new Map();
const cachedGet = async (key, path, params) => {
  if (cache.has(key)) return cache.get(key);
  const { data } = await api.get(path, { params });
  cache.set(key, data);
  return data;
};

export const fetchAccount = () => cachedGet("account", "/account");
export const fetchLiveCategories = () => cachedGet("live-cats", "/live/categories");
export const fetchLiveStreams = (cat) =>
  cachedGet(`live-streams-${cat || "all"}`, "/live/streams", cat ? { category_id: cat } : {});
export const fetchVodCategories = () => cachedGet("vod-cats", "/vod/categories");
export const fetchVodStreams = (cat) =>
  cachedGet(`vod-streams-${cat || "all"}`, "/vod/streams", cat ? { category_id: cat } : {});
export const fetchVodInfo = (id) => cachedGet(`vod-info-${id}`, `/vod/info/${id}`);
export const fetchSeriesCategories = () => cachedGet("series-cats", "/series/categories");
export const fetchSeries = (cat) =>
  cachedGet(`series-${cat || "all"}`, "/series", cat ? { category_id: cat } : {});
export const fetchSeriesInfo = (id) => cachedGet(`series-info-${id}`, `/series/info/${id}`);
export const fetchShortEpg = (streamId) =>
  api.get("/live/short_epg", { params: { stream_id: streamId, limit: 6 } }).then((r) => r.data);
export const fetchFullEpg = (streamId) =>
  api.get("/live/epg", { params: { stream_id: streamId } }).then((r) => r.data);
export const search = (q) => api.get("/search", { params: { q } }).then((r) => r.data);

export const decodeEpg = (b64) => {
  try {
    return decodeURIComponent(escape(atob(b64 || "")));
  } catch {
    try { return atob(b64 || ""); } catch { return ""; }
  }
};
