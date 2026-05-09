"use client";

/**
 * Triggers server-side full-PDF text extraction into private Storage (fire-and-forget).
 */
export async function fireCatalogTextReindex(
  cardId: string,
  idToken: string,
): Promise<void> {
  try {
    await fetch("/api/admin/catalog-reindex-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ cardId }),
    });
  } catch {
    /* non-blocking */
  }
}
