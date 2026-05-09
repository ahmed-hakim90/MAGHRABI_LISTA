import "server-only";

import { PDFParse } from "pdf-parse";

/** Same cap as excerpt fetch — avoid huge memory on corrupt PDFs. */
export const PDF_INDEX_MAX_BYTES = 15 * 1024 * 1024;
/** Firestore-friendly upper bound; full catalogs rarely need more for keyword RAG. */
export const PDF_INDEX_MAX_CHARS = 900_000;

/**
 * Extract all pages as plain text (whitespace-normalized). Used for offline chat indexing.
 */
export async function extractFullPdfTextFromBuffer(
  buf: Buffer,
): Promise<string | null> {
  if (buf.length === 0 || buf.length > PDF_INDEX_MAX_BYTES) return null;
  const parser = new PDFParse({ data: buf });
  try {
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, " ").trim();
    if (!text.length) return null;
    return text.length > PDF_INDEX_MAX_CHARS
      ? text.slice(0, PDF_INDEX_MAX_CHARS)
      : text;
  } catch {
    return null;
  } finally {
    await parser.destroy();
  }
}

export async function fetchPdfBufferFromUrl(
  fileUrl: string,
): Promise<Buffer | null> {
  try {
    const res = await fetch(fileUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > PDF_INDEX_MAX_BYTES) return null;
    return buf;
  } catch {
    return null;
  }
}
