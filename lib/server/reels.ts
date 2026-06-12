import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import type { CatalogReelPublic, ReelAudience, VideoProvider } from "@/lib/types/reels";

const COLLECTION = "catalog_reels";

function parseReelAudience(raw: unknown): ReelAudience {
  if (raw === "all") return "all";
  const a = normalizeAudienceFromDoc(raw);
  return a;
}

function toPublic(
  id: string,
  data: FirebaseFirestore.DocumentData,
): CatalogReelPublic {
  return {
    id,
    title: String(data.title ?? ""),
    sourceUrl: String(data.sourceUrl ?? ""),
    provider: (data.provider as VideoProvider) ?? "unknown",
    embedUrl: String(data.embedUrl ?? ""),
    audience: parseReelAudience(data.audience),
    sortOrder: Number(data.sortOrder ?? 0),
    likeCount: Number(data.likeCount ?? 0),
  };
}

async function loadActiveReelsForAudience(
  audience: CatalogAudience,
): Promise<CatalogReelPublic[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).where("isActive", "==", true).get();

  return snap.docs
    .map((d) => toPublic(d.id, d.data()))
    .filter(
      (r) =>
        r.embedUrl && (r.audience === "all" || r.audience === audience),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ar"));
}

async function loadAllActiveReels(): Promise<CatalogReelPublic[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).where("isActive", "==", true).get();
  return snap.docs
    .map((d) => toPublic(d.id, d.data()))
    .filter((r) => r.embedUrl)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ar"));
}

export const getActiveReelsForAudience = unstable_cache(
  loadActiveReelsForAudience,
  ["active-reels-by-audience"],
  { revalidate: 900, tags: ["public-reels"] },
);

export const getAllActiveReels = unstable_cache(
  loadAllActiveReels,
  ["all-active-reels"],
  { revalidate: 900, tags: ["public-reels"] },
);
