/** Static interactive catalog. The card opens this file unchanged. */
export const SARAYA_FLIP_HREF = "/flipbooks/saraya-2027.html";
export const SARAYA_FLIP_COVER = "/flipbooks/saraya-2027-cover.jpg";
export const SARAYA_FLIP_TITLE = "سريا رمضان 2027";

const SEARCH_TEXT =
  "سريا رمضان 2027 كتالوج تفاعلي saraya ramadan ستائر فوانيس";

export function matchesSarayaFlipSearch(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return SEARCH_TEXT.toLowerCase().includes(normalized);
}
