import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import { getAdminBucket, getAdminFirestore } from "@/lib/firebase/admin";
import {
  bundleFromFirestoreFileCardData,
  getPdfTextExcerptForUrl,
  type CatalogCardChatBundle,
} from "@/lib/server/catalogCardChatContext";
import {
  extractFullPdfTextFromBuffer,
  fetchPdfBufferFromUrl,
} from "@/lib/server/catalogPdfFullText";
import { getChatIndexTextPathForAudience } from "@/lib/utils/storagePaths";

const INDEX_CACHE_MS = 15 * 60 * 1000;
const indexTextCache = new Map<
  string,
  { expires: number; text: string | null }
>();

export async function downloadCatalogIndexText(
  storagePath: string,
): Promise<string | null> {
  const key = storagePath.trim();
  if (!key) return null;
  const now = Date.now();
  const hit = indexTextCache.get(key);
  if (hit && hit.expires > now) return hit.text;

  let text: string | null = null;
  try {
    const [buf] = await getAdminBucket().file(key).download();
    const s = buf.toString("utf8").trim();
    text = s.length ? s : null;
  } catch {
    text = null;
  }
  indexTextCache.set(key, { expires: now + INDEX_CACHE_MS, text });
  return text;
}

/**
 * Prefer Firestore `catalogTextPath` (full extract); else parse first pages from PDF URL (legacy).
 */
export async function getCatalogPlainTextForChat(
  fileUrl: string,
  catalogTextPath: string | null | undefined,
  fallbackPartialText: () => Promise<string | null>,
): Promise<string | null> {
  const p = catalogTextPath?.trim();
  if (p) {
    const full = await downloadCatalogIndexText(p);
    if (full) return full;
  }
  return fallbackPartialText();
}

/** Full indexed text when available; otherwise first-pages PDF excerpt (existing behavior). */
export async function getCatalogTextForChatFromBundle(
  bundle: CatalogCardChatBundle,
): Promise<string | null> {
  return getCatalogPlainTextForChat(
    bundle.fileUrl,
    bundle.catalogTextPath,
    () => getPdfTextExcerptForUrl(bundle.fileUrl),
  );
}

/**
 * Build / upload full-text index for one card (Admin SDK; bypasses Storage rules).
 */
export async function reindexCatalogCardTextById(
  cardId: string,
  db: Firestore = getAdminFirestore(),
): Promise<{ ok: boolean; charCount?: number; error?: string }> {
  const id = cardId.trim();
  if (!id) return { ok: false, error: "missing_card_id" };

  const snap = await db.collection("fileCards").doc(id).get();
  if (!snap.exists) return { ok: false, error: "not_found" };
  const data = snap.data() as Record<string, unknown>;
  if (!data.isActive) return { ok: false, error: "inactive" };

  const audience = normalizeAudienceFromDoc(data.audience);
  const bundle = bundleFromFirestoreFileCardData(id, data);
  if (!bundle) return { ok: false, error: "no_bundle" };

  const fileUrl = bundle.fileUrl.trim();
  if (!fileUrl) return { ok: false, error: "no_file_url" };

  const buf = await fetchPdfBufferFromUrl(fileUrl);
  if (!buf) {
    await snap.ref.update({
      catalogTextError: "fetch_or_size_failed",
      catalogTextIndexedAt: FieldValue.serverTimestamp(),
    });
    return { ok: false, error: "fetch_or_size_failed" };
  }

  const text = await extractFullPdfTextFromBuffer(buf);
  if (!text) {
    await snap.ref.update({
      catalogTextError: "extract_failed",
      catalogTextIndexedAt: FieldValue.serverTimestamp(),
    });
    return { ok: false, error: "extract_failed" };
  }

  const storagePath = getChatIndexTextPathForAudience(audience, id);
  const prevPath = String(data.catalogTextPath ?? "").trim();
  const bucket = getAdminBucket();
  if (prevPath && prevPath !== storagePath) {
    try {
      await bucket.file(prevPath).delete({ ignoreNotFound: true });
    } catch {
      /* ignore */
    }
    indexTextCache.delete(prevPath);
  }
  const file = bucket.file(storagePath);
  await file.save(Buffer.from(text, "utf8"), {
    contentType: "text/plain; charset=utf-8",
    resumable: false,
  });

  await snap.ref.update({
    catalogTextPath: storagePath,
    catalogTextCharCount: text.length,
    catalogTextIndexedAt: FieldValue.serverTimestamp(),
    catalogTextError: FieldValue.delete(),
  });

  indexTextCache.delete(storagePath);
  return { ok: true, charCount: text.length };
}
