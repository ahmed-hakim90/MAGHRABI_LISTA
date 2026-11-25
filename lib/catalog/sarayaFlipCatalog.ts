/**
 * Static interactive catalog. The card and the private share link open this
 * file unchanged.
 *
 * The file name carries a random suffix so the link cannot be guessed. It is
 * an unlisted link, not a login: anyone who has the URL can open it, and
 * search engines are told not to index it (see `next.config.ts`).
 */
export const SARAYA_FLIP_HREF = "/flipbooks/saraya-2027-369026c6086f.html";
export const SARAYA_FLIP_COVER = "/flipbooks/saraya-2027-cover.jpg";
export const SARAYA_FLIP_TITLE = "سريا رمضان 2027";

const SEARCH_TEXT =
  "سريا رمضان 2027 كتالوج تفاعلي saraya ramadan ستائر فوانيس";

export function matchesSarayaFlipSearch(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return SEARCH_TEXT.toLowerCase().includes(normalized);
}
