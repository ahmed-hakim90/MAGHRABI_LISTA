import type { AnnouncementItem } from "@/lib/types/models";

export const ANNOUNCEMENTS_SETTINGS_DOC = "announcements";

function toMillis(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (typeof o.seconds === "number") return o.seconds * 1000;
    if (typeof o.toMillis === "function") {
      const ms = (o.toMillis as () => number)();
      return Number.isFinite(ms) ? ms : null;
    }
  }
  return null;
}

export function parseAnnouncementItems(raw: unknown): AnnouncementItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index): AnnouncementItem | null => {
      if (!entry || typeof entry !== "object") return null;
      const data = entry as Record<string, unknown>;
      const textAr = String(data.textAr ?? "").trim();
      const textEn = String(data.textEn ?? "").trim();
      if (!textAr && !textEn) return null;
      const startAt = toMillis(data.startAt);
      const endAt = toMillis(data.endAt);
      return {
        id: String(data.id ?? `ann-${index}`),
        textAr,
        textEn,
        link: String(data.link ?? "").trim(),
        linkLabelAr: String(data.linkLabelAr ?? "").trim(),
        linkLabelEn: String(data.linkLabelEn ?? "").trim(),
        openInNewTab: Boolean(data.openInNewTab),
        isActive: Boolean(data.isActive),
        sortOrder: Number.isFinite(Number(data.sortOrder))
          ? Number(data.sortOrder)
          : index,
        startAt,
        endAt,
        createdAt: toMillis(data.createdAt),
        updatedAt: toMillis(data.updatedAt),
      };
    })
    .filter((item): item is AnnouncementItem => item !== null);
}

/** isActive + schedule window, sorted by sortOrder then creation time. */
export function getActiveAnnouncements(
  items: AnnouncementItem[],
  nowMs: number,
): AnnouncementItem[] {
  return items
    .filter(
      (a) =>
        a.isActive &&
        (a.startAt == null || nowMs >= a.startAt) &&
        (a.endAt == null || nowMs <= a.endAt),
    )
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );
}

/** Internal paths start with "/" (single slash only); everything else must be http(s). */
export function isSafeAnnouncementLink(link: string): boolean {
  if (!link) return true;
  if (link.startsWith("//") || link.startsWith("/\\")) return false;
  if (link.startsWith("/")) return true;
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function announcementDisplayText(
  a: AnnouncementItem,
): { text: string; dir: "rtl" | "ltr" } {
  if (a.textAr) return { text: a.textAr, dir: "rtl" };
  return { text: a.textEn, dir: "ltr" };
}

export function announcementLinkLabel(a: AnnouncementItem): string {
  return a.linkLabelAr || a.linkLabelEn || "";
}

/** Firestore-safe plain-object payload for one announcement. */
export function announcementToWire(
  a: AnnouncementItem,
): Record<string, unknown> {
  return {
    id: a.id,
    textAr: a.textAr.trim(),
    textEn: a.textEn.trim(),
    link: a.link.trim(),
    linkLabelAr: a.linkLabelAr.trim(),
    linkLabelEn: a.linkLabelEn.trim(),
    openInNewTab: Boolean(a.openInNewTab),
    isActive: Boolean(a.isActive),
    sortOrder: Number.isFinite(a.sortOrder) ? a.sortOrder : 0,
    startAt: a.startAt,
    endAt: a.endAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
