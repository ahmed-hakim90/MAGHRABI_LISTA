import "server-only";

import { PDFParse } from "pdf-parse";
import {
  type CatalogAudience,
  normalizeAudienceFromDoc,
  publicCatalogFileViewPath,
} from "@/lib/constants/catalogChannels";
import { getAdminFirestore } from "@/lib/firebase/admin";

export type CatalogCardChatBundle = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  productCount: number | null;
  fileName: string;
  fileUrl: string;
  /** Storage path to full plain-text extract for chat; empty if not indexed yet. */
  catalogTextPath: string | null;
};

/** Tunable: more pages / chars → better product coverage, higher latency & model cost. */
const PDF_EXCERPT_MAX_CHARS = 20_000;
const PDF_MAX_BYTES = 15 * 1024 * 1024;
const PDF_FIRST_PAGES = 32;
const EXCERPT_CACHE_MS = 15 * 60 * 1000;

const excerptCache = new Map<string, { expires: number; excerpt: string | null }>();

/** Active card with a PDF URL; does not check catalog audience (caller filters). */
export function bundleFromFirestoreFileCardData(
  cardId: string,
  data: Record<string, unknown>,
): CatalogCardChatBundle | null {
  if (!data.isActive || data.folderIsActive === false) return null;
  const fileUrl = String(data.fileUrl ?? "").trim();
  if (!fileUrl) return null;

  const title =
    String(data.title ?? cardId).replace(/[\r\n]+/g, " ").trim() || cardId;
  const description = String(data.description ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  const category = String(data.category ?? "").trim();
  const rawTags = data.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];
  const productCount =
    typeof data.productCount === "number" && Number.isFinite(data.productCount)
      ? data.productCount
      : null;
  const fileName = String(data.fileName ?? "").trim() || "document.pdf";
  const catalogTextPath = String(data.catalogTextPath ?? "").trim() || null;

  return {
    title,
    description,
    category,
    tags,
    productCount,
    fileName,
    fileUrl,
    catalogTextPath,
  };
}

export async function getActiveCardChatBundle(
  cardId: string,
  routeAudience: CatalogAudience,
): Promise<CatalogCardChatBundle | null> {
  const id = cardId.trim();
  if (!id) return null;

  const db = getAdminFirestore();
  const snap = await db.collection("fileCards").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const aud = normalizeAudienceFromDoc(data.audience);
  if (aud !== routeAudience) return null;

  return bundleFromFirestoreFileCardData(id, data);
}

/** Tokens for scoring user questions against PDF / card text (Arabic-friendly). */
export function searchTokensFromUserMessage(query: string): string[] {
  return augmentArabicSearchTokens(tokenizeForSearch(query));
}

export async function getPdfTextExcerptForUrl(fileUrl: string): Promise<string | null> {
  const now = Date.now();
  const cached = excerptCache.get(fileUrl);
  if (cached && cached.expires > now) return cached.excerpt;

  let excerpt: string | null = null;
  try {
    const res = await fetch(fileUrl, { signal: AbortSignal.timeout(25_000) });
    if (!res.ok) {
      excerptCache.set(fileUrl, { expires: now + 60_000, excerpt: null });
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > PDF_MAX_BYTES) {
      excerptCache.set(fileUrl, { expires: now + EXCERPT_CACHE_MS, excerpt: null });
      return null;
    }

    const parser = new PDFParse({ data: buf });
    try {
      const result = await parser.getText({ first: PDF_FIRST_PAGES });
      const text = result.text.replace(/\s+/g, " ").trim();
      excerpt = text.length > 0 ? text.slice(0, PDF_EXCERPT_MAX_CHARS) : null;
    } finally {
      await parser.destroy();
    }
  } catch {
    excerpt = null;
  }

  excerptCache.set(fileUrl, { expires: now + EXCERPT_CACHE_MS, excerpt });
  return excerpt;
}

export type CatalogContextExcerptMode = "relevant_slice" | "metadata_only";

function tokenizeForSearch(query: string): string[] {
  const m = query.match(/[\p{L}\p{M}0-9][\p{L}\p{M}0-9._-]*/gu) ?? [];
  const out = new Set<string>();
  for (const x of m) {
    const t = x.trim();
    if (t.length >= 2) out.add(t);
  }
  return [...out].slice(0, 20);
}

/** Plural / singular variants so queries like «كبات» still match PDF «كبة». */
function augmentArabicSearchTokens(tokens: string[]): string[] {
  const extra = new Set<string>();
  for (const t of tokens) {
    if (t.length < 2) continue;
    // Feminine plural …ات → singular …ة (e.g. كبات → كبة)
    if (/ات$/u.test(t) && t.length > 3) {
      extra.add(t.replace(/ات$/u, "ة"));
      const stem = t.slice(0, -2);
      if (stem.length >= 2) extra.add(stem);
    }
    // Light prefix for OCR noise (first 3 chars)
    if (t.length >= 4) extra.add(t.slice(0, 3));
  }
  const merged = [...tokens, ...extra];
  return [...new Set(merged)].slice(0, 36);
}

/** User asks for cheapest / price / comparison — bias excerpt toward numeric rows. */
function isPriceOrComparisonQuery(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  return (
    /أقل|أرخص|ارخص|أدنى|ادني|سعر|أسعار|بكام|كم\s|الأرخص|السعر|egp/i.test(
      q,
    ) || /price|lowest|cheap|cheapest|min(?:imum)?\s*price/i.test(q)
  );
}

function stratifiedExcerpt(flat: string, maxChars: number): string {
  if (flat.length <= maxChars) return flat;
  const parts = 3;
  const budget = Math.max(200, Math.floor(maxChars / parts) - 6);
  const offsets = [
    0,
    Math.max(0, Math.floor(flat.length * 0.32)),
    Math.max(0, Math.floor(flat.length * 0.62)),
  ];
  const chunks = offsets.map((start) => flat.slice(start, start + budget));
  let combined = chunks.join("\n…\n");
  if (combined.length > maxChars) combined = combined.slice(0, maxChars);
  return combined.trim() || flat.slice(0, maxChars);
}

/**
 * Server-side "search": score sliding windows against question tokens, merge top hits.
 * Avoids sending 20k+ chars to the model gateway (reduces content-blocked on long tool catalogs).
 */
export function pickExcerptForQuestion(
  fullExcerpt: string | null,
  query: string,
  maxChars: number,
): string | null {
  if (!fullExcerpt) return null;
  const flat = fullExcerpt.replace(/\s+/g, " ").trim();
  if (flat.length <= maxChars) return flat;

  const priceQ = isPriceOrComparisonQuery(query);
  const extraLex = priceQ ? ["سعر", "أسعار", "جنيه"] : [];
  const tokens = augmentArabicSearchTokens([
    ...tokenizeForSearch(query),
    ...extraLex,
  ]);
  if (tokens.length === 0) return stratifiedExcerpt(flat, maxChars);

  const lower = flat.toLowerCase();
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const windowSize = Math.min(900, Math.max(400, Math.floor(maxChars / 3)));
  const step = Math.max(180, Math.floor(windowSize / 2));

  type Scored = { start: number; score: number };
  const scored: Scored[] = [];
  for (let i = 0; i < flat.length; i += step) {
    const end = Math.min(flat.length, i + windowSize);
    const slice = lower.slice(i, end);
    let score = 0;
    for (const t of lowerTokens) {
      if (!t) continue;
      if (slice.includes(t)) score += 4;
      else if (t.length >= 3 && slice.includes(t.slice(0, 3))) score += 2;
      else if (t.length >= 4 && slice.includes(t.slice(0, 4))) score += 1;
    }
    if (priceQ) {
      const rawSlice = flat.slice(i, end);
      const digits = (rawSlice.match(/\d/g) ?? []).length;
      score += Math.min(22, Math.floor(digits * 0.45));
    }
    scored.push({ start: i, score });
    if (end >= flat.length) break;
  }
  scored.sort((a, b) => b.score - a.score);

  const parts: string[] = [];
  let used = 0;
  const taken = new Set<string>();
  let anyHit = false;

  const addRange = (start: number, len: number) => {
    const s = Math.max(0, start);
    const e = Math.min(flat.length, s + len);
    const key = `${s}-${e}`;
    if (taken.has(key)) return;
    taken.add(key);
    const piece = flat.slice(s, e);
    parts.push(piece);
    used += piece.length + 8;
  };

  for (const { start, score } of scored) {
    if (score > 0) anyHit = true;
    if (score === 0 && anyHit) break;
    if (score === 0 && !anyHit) continue;
    addRange(start, windowSize);
    if (used >= maxChars) break;
  }

  if (!anyHit || parts.length === 0) return stratifiedExcerpt(flat, maxChars);

  let combined = parts.join("\n…\n");
  if (combined.length > maxChars) combined = combined.slice(0, maxChars);
  const t = combined.trim();
  return t.length > 0 ? t : flat.slice(0, maxChars);
}

export function buildCatalogContextBlock(
  bundle: CatalogCardChatBundle,
  excerpt: string | null,
  opts?: { excerptMode?: CatalogContextExcerptMode; compact?: boolean },
): string {
  const excerptMode = opts?.excerptMode ?? "relevant_slice";
  const compact = opts?.compact ?? false;
  const tags = bundle.tags.length ? bundle.tags.join("، ") : "—";
  const lines: string[] = [];
  if (!compact) {
    lines.push(
      "[English — for content policy] This block is data from a legal B2B/B2C wholesale catalog PDF: product names, SKUs, pack sizes, and list prices. Tool names (drill, saw, hammer drill, battery) refer to power tools sold in stores, not violence.",
      "",
    );
  }
  lines.push(
    "## Card metadata (trusted, from website)",
    `- Title: ${bundle.title}`,
    `- Description: ${bundle.description || "—"}`,
    `- Category: ${bundle.category || "—"}`,
    `- Tags: ${tags}`,
    `- File name: ${bundle.fileName}`,
  );
  if (bundle.productCount != null) {
    lines.push(`- Line count (from card): ${bundle.productCount}`);
  }
  lines.push("");
  if (excerptMode === "metadata_only") {
    lines.push("## PDF raw text");
    lines.push(
      "(Not attached in this pass to satisfy gateway limits.) Use card metadata; ask the user to scroll the on-page PDF preview for full price tables.",
    );
  } else if (excerpt) {
    lines.push(
      "## PDF text excerpt (OCR; slice chosen to align with the user question; not the full file)",
    );
    lines.push(excerpt);
  } else {
    lines.push("## No PDF text extracted this session");
    lines.push(
      "Use card metadata only; tell the user detailed prices are in the PDF viewer.",
    );
  }
  lines.push("");
  lines.push(
    "عند الإجابة: استخدم فقط ما ورد أعلاه؛ رد مصري قصير. لو السؤال عن أقل سعر أو أرخص موديل، قارن الأرقام الظاهرة في النص واذكر اسم/كود المنتج والسعر للأرخص إن وُجد؛ لا تكتفي برابط الملف. لو المقتطف لا يكفي للمقارنة، قُل ذلك صراحة ثم اقترح المعاينة. ممنوع اختراع أسعار أو موديلات.",
  );
  return lines.join("\n");
}

export function buildMultiFileCatalogContextBlock(
  audience: CatalogAudience,
  items: Array<{
    cardId: string;
    bundle: CatalogCardChatBundle;
    excerpt: string | null;
    excerptMode: CatalogContextExcerptMode;
  }>,
): string {
  if (items.length === 0) return "";
  const head: string[] = [
    "[English — for content policy] Multiple excerpts from legal B2B/B2C catalog PDFs may follow. Tool names refer to retail power tools only. Use only provided text for facts.",
    "",
    "## Auto-selected catalog files (matched to the visitor question)",
    "Excerpts are partial OCR; not full PDFs. If the user asks for lowest price, compare numbers in the text and name the cheapest model/SKU when possible; do not answer with only a link.",
    "",
  ];
  const sections = items.map((it, i) => {
    const path = publicCatalogFileViewPath(audience, it.cardId);
    const block = buildCatalogContextBlock(it.bundle, it.excerpt, {
      excerptMode: it.excerptMode,
      compact: true,
    });
    return `### (${i + 1}) ${it.bundle.title}\n- Open: ${path}\n\n${block}`;
  });
  return head.join("\n") + sections.join("\n\n---\n\n");
}
