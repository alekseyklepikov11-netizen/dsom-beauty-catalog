const KEY = "dsom-recently-viewed";
const MAX = 8;

export const addRecentlyViewed = (productId: string) => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
};

export const getRecentlyViewed = (excludeId?: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return excludeId ? ids.filter((id) => id !== excludeId) : ids;
  } catch {
    return [];
  }
};

export const clearRecentlyViewed = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
};
