import "server-only";

import {
  type CatalogAudience,
  normalizeAudienceFromDoc,
} from "@/lib/constants/catalogChannels";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  bundleFromFirestoreFileCardData,
  searchTokensFromUserMessage,
} from "@/lib/server/catalogCardChatContext";
import { getCatalogTextForChatFromBundle } from "@/lib/server/catalogTextIndex";

const MAX_FINAL_FILES = 4;
/** When card metadata does not match the question, probe this many PDFs (cached) then re-rank. */
const MAX_PDF_PROBE = 12;
/** If the best metadata score reaches this, only those top files are fetched (save work). */
const META_STRONG = 5;

type CandidateRow = {
  cardId: string;
  order: number;
  bundle: NonNullable<ReturnType<typeof bundleFromFirestoreFileCardData>>;
  folderName: string;
};

function scoreHaystack(haystack: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const h = haystack.toLowerCase();
  let s = 0;
  for (const t of tokens) {
    const tl = t.toLowerCase();
    if (tl.length < 2) continue;
    if (h.includes(tl)) s += 6;
    else if (tl.length >= 3 && h.includes(tl.slice(0, 3))) s += 2;
  }
  return s;
}

function metadataHaystack(row: CandidateRow): string {
  const b = row.bundle;
  return [
    b.title,
    b.description,
    b.category,
    b.tags.join(" "),
    row.folderName,
  ].join(" ");
}

async function listCandidateRows(
  routeAudience: CatalogAudience,
  folderId?: string,
): Promise<CandidateRow[]> {
  const db = getAdminFirestore();
  const base = db
    .collection("fileCards")
    .where("isActive", "==", true)
    .where("folderIsActive", "==", true);
  const q =
    routeAudience === "wholesale"
      ? base
      : base.where("audience", "==", routeAudience);
  const snap = await q.limit(320).get();
  const rows: CandidateRow[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const aud = normalizeAudienceFromDoc(data.audience);
    if (aud !== routeAudience) continue;
    if (folderId && String(data.folderId ?? "") !== folderId) continue;
    const bundle = bundleFromFirestoreFileCardData(doc.id, data);
    if (!bundle) continue;
    rows.push({
      cardId: doc.id,
      order: Number(data.order ?? 0),
      bundle,
      folderName: String(data.folderName ?? ""),
    });
  }
  rows.sort((a, b) => a.order - b.order || a.bundle.title.localeCompare(b.bundle.title));
  return rows;
}

export type AutoPickedChatCard = {
  cardId: string;
  bundle: NonNullable<ReturnType<typeof bundleFromFirestoreFileCardData>>;
  fullExcerpt: string | null;
};

/**
 * When the visitor is not on `/file/{id}/view`, pick a few catalog PDFs whose
 * titles/tags or PDF text best match the question, and return excerpts (cached server-side).
 */
export async function loadAutoPickedCardsForChat(
  message: string,
  routeAudience: CatalogAudience,
  options: { folderId?: string } = {},
): Promise<AutoPickedChatCard[]> {
  const folderId = options.folderId?.trim();
  const candidates = await listCandidateRows(
    routeAudience,
    folderId || undefined,
  );
  if (candidates.length === 0) return [];

  const tokens = searchTokensFromUserMessage(message);

  const metaScored = candidates.map((row) => ({
    row,
    meta: scoreHaystack(metadataHaystack(row), tokens),
  }));
  metaScored.sort((a, b) => b.meta - a.meta || a.row.order - b.row.order);

  const strongMeta = metaScored[0].meta >= META_STRONG;
  const probePool = strongMeta
    ? metaScored.slice(0, MAX_FINAL_FILES)
    : metaScored.slice(0, MAX_PDF_PROBE);

  const withPdf = await Promise.all(
    probePool.map(async ({ row, meta }) => ({
      row,
      meta,
      excerpt: await getCatalogTextForChatFromBundle(row.bundle),
    })),
  );

  const ranked = withPdf.map(({ row, meta, excerpt }) => {
    const pdfPart = scoreHaystack(excerpt ?? "", tokens);
    return { row, excerpt, combined: meta * 6 + pdfPart, pdfPart };
  });
  ranked.sort(
    (a, b) =>
      b.combined - a.combined ||
      b.pdfPart - a.pdfPart ||
      a.row.order - b.row.order,
  );

  const seen = new Set<string>();
  const out: AutoPickedChatCard[] = [];
  for (const r of ranked) {
    if (seen.has(r.row.cardId)) continue;
    seen.add(r.row.cardId);
    out.push({
      cardId: r.row.cardId,
      bundle: r.row.bundle,
      fullExcerpt: r.excerpt,
    });
    if (out.length >= MAX_FINAL_FILES) break;
  }

  return out;
}
