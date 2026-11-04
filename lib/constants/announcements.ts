import type { AnnouncementItem } from "@/lib/types/models";

/** Default wholesale ticker copy (campaign). Used when Firestore has no active items. */
export const DEFAULT_TICKER_TEXT_AR =
  "رغم غلاء الاسعار مكملين معاك بنفس الاسعار !";

export const DEFAULT_TICKER_ANNOUNCEMENT_ID = "white-friday-prices";

export function defaultTickerAnnouncement(
  nowMs = Date.now(),
): AnnouncementItem {
  return {
    id: DEFAULT_TICKER_ANNOUNCEMENT_ID,
    textAr: DEFAULT_TICKER_TEXT_AR,
    textEn: "",
    link: "",
    linkLabelAr: "",
    linkLabelEn: "",
    openInNewTab: false,
    isActive: true,
    sortOrder: 0,
    startAt: null,
    endAt: null,
    createdAt: nowMs,
    updatedAt: nowMs,
  };
}
