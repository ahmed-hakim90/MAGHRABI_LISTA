/** Firestore + FCM + Storage logical audience (lists without prices). */
export type CatalogAudience = "wholesale" | "retail" | "no_prices";

/** First URL segment for public routes: /wholesale, /retail, /lists */
export const CATALOG_CHANNEL_SEGMENTS = ["wholesale", "retail", "lists"] as const;
export type CatalogChannelSegment = (typeof CATALOG_CHANNEL_SEGMENTS)[number];

export const CHANNEL_TO_AUDIENCE: Record<CatalogChannelSegment, CatalogAudience> =
  {
    wholesale: "wholesale",
    retail: "retail",
    lists: "no_prices",
  };

export const AUDIENCE_TO_CHANNEL: Record<CatalogAudience, CatalogChannelSegment> =
  {
    wholesale: "wholesale",
    retail: "retail",
    no_prices: "lists",
  };

/** Folder name under STORAGE_FOLDER for uploads. */
export function storagePrefixForAudience(audience: CatalogAudience): string {
  if (audience === "wholesale") return "wholesale";
  if (audience === "retail") return "retail";
  return "no_prices";
}

export const AUDIENCE_LABELS_AR: Record<CatalogAudience, string> = {
  wholesale: "جملة",
  retail: "تجزئة",
  no_prices: "قوائم بدون أسعار",
};

export function isCatalogChannelSegment(
  s: string,
): s is CatalogChannelSegment {
  return (CATALOG_CHANNEL_SEGMENTS as readonly string[]).includes(s);
}

export function parseAudienceFromDoc(
  raw: unknown,
): CatalogAudience | undefined {
  if (raw === "wholesale" || raw === "retail" || raw === "no_prices") {
    return raw;
  }
  return undefined;
}

export function normalizeAudienceFromDoc(raw: unknown): CatalogAudience {
  return parseAudienceFromDoc(raw) ?? "wholesale";
}

export function publicCatalogFileViewPath(
  audience: CatalogAudience,
  cardId: string,
): string {
  return `/${AUDIENCE_TO_CHANNEL[audience]}/file/${cardId}/view`;
}

export function publicCatalogFilePdfPath(
  audience: CatalogAudience,
  cardId: string,
): string {
  return `/${AUDIENCE_TO_CHANNEL[audience]}/file/${cardId}/pdf`;
}

export function publicPriceListsIndexPath(
  audience: CatalogAudience,
): string {
  return `/${AUDIENCE_TO_CHANNEL[audience]}/price-lists`;
}

export function publicPriceListPath(
  audience: CatalogAudience,
  slug: string,
): string {
  return `/${AUDIENCE_TO_CHANNEL[audience]}/price-lists/${slug}`;
}

export function publicReelsPath(audience: CatalogAudience): string {
  return `/${AUDIENCE_TO_CHANNEL[audience]}/reels`;
}

export function publicReelsFeedPath(audience: CatalogAudience): string {
  return `${publicReelsPath(audience)}/feed`;
}

export function manifestPathForChannelSegment(
  ch: CatalogChannelSegment,
): string {
  const m: Record<CatalogChannelSegment, string> = {
    wholesale: "/manifest-wholesale.webmanifest",
    retail: "/manifest-retail.webmanifest",
    lists: "/manifest-lists.webmanifest",
  };
  return m[ch];
}

export function pwaAppleWebAppTitleForChannelSegment(
  ch: CatalogChannelSegment,
): string {
  const t: Record<CatalogChannelSegment, string> = {
    wholesale: "Maghrabi Wholesale",
    retail: "Maghrabi Retail",
    lists: "Maghrabi Lists",
  };
  return t[ch];
}
