import { DEFAULT_SITE_HOTLINE_NUMBER } from "@/lib/constants/siteDefaults";

/** Digits-only hotline for `tel:` links (e.g. 17355). */
export function normalizeHotlineNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function parseHotlineNumber(raw: unknown): string {
  return normalizeHotlineNumber(String(raw ?? ""));
}

/** Missing field → default; explicitly saved empty → hide button. */
export function hotlineFromFirestore(
  raw: unknown,
  fieldPresent: boolean,
): string {
  if (!fieldPresent) return DEFAULT_SITE_HOTLINE_NUMBER;
  return parseHotlineNumber(raw);
}

/** In-memory settings (e.g. old localStorage snapshots) may omit the field. */
export function resolveSiteHotlineNumber(
  raw: string | undefined | null,
): string {
  if (raw == null) return DEFAULT_SITE_HOTLINE_NUMBER;
  return parseHotlineNumber(raw);
}
