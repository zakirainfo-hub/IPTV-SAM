const FAV_KEY = "ottnav_favs";
const HIST_KEY = "ottnav_history";
const PROF_KEY = "ottnav_profile";

export const getFavorites = () => {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
};
export const saveFavorites = (list) => localStorage.setItem(FAV_KEY, JSON.stringify(list));
export const toggleFavorite = (item) => {
  const list = getFavorites();
  const key = `${item.kind}:${item.id}`;
  const idx = list.findIndex((x) => `${x.kind}:${x.id}` === key);
  if (idx >= 0) list.splice(idx, 1); else list.unshift({ ...item, addedAt: Date.now() });
  saveFavorites(list);
  return idx < 0;
};
export const isFavorite = (kind, id) =>
  getFavorites().some((x) => x.kind === kind && String(x.id) === String(id));

export const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch { return []; }
};
export const pushHistory = (item) => {
  const list = getHistory().filter((x) => !(x.kind === item.kind && String(x.id) === String(item.id)));
  list.unshift({ ...item, watchedAt: Date.now() });
  localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 80)));
};

export const getProfile = () => {
  try { return JSON.parse(localStorage.getItem(PROF_KEY) || "null") || { name: "Guest", theme: "dark" }; } catch { return { name: "Guest", theme: "dark" }; }
};
export const saveProfile = (p) => localStorage.setItem(PROF_KEY, JSON.stringify(p));
