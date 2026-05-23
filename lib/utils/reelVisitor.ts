const STORAGE_KEY = "maghrabi_reel_visitor_v1";

export function getReelVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now()}`;
  }
}

const LIKED_KEY = "maghrabi_reel_liked_v1";

export function getLocallyLikedReelIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function setLocallyLikedReelIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}
