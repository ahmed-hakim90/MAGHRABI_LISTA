import "server-only";

import {
  type CatalogAudience,
  normalizeAudienceFromDoc,
} from "@/lib/constants/catalogChannels";
import { getAdminFirestore } from "@/lib/firebase/admin";

export type CatalogCardGateOk = {
  ok: true;
  title: string;
  fileUrl: string;
  version: number | null;
};

export type CatalogCardGateResult = CatalogCardGateOk | { ok: false };

export async function getActiveCardForCatalogAudience(
  cardId: string,
  routeAudience: CatalogAudience,
): Promise<CatalogCardGateResult> {
  const db = getAdminFirestore();
  const snap = await db.collection("fileCards").doc(cardId).get();
  if (!snap.exists) return { ok: false };
  const data = snap.data() as Record<string, unknown>;
  if (!data.isActive || data.folderIsActive === false) return { ok: false };
  const aud = normalizeAudienceFromDoc(data.audience);
  if (aud !== routeAudience) return { ok: false };
  const fileUrl = String(data.fileUrl ?? "").trim();
  if (!fileUrl) return { ok: false };
  const title =
    String(data.title ?? cardId).replace(/[\r\n]+/g, " ").trim() || cardId;
  const rawVersion = Number(data.version);
  const version =
    Number.isFinite(rawVersion) && rawVersion > 0
      ? Math.floor(rawVersion)
      : null;
  return { ok: true, title, fileUrl, version };
}
