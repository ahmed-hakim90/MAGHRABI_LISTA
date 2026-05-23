/** Normalize Arabic/Latin text into a URL slug. */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function priceListItemDocId(listId: string, sku: string): string {
  const normalized = sku
    .trim()
    .toLowerCase()
    .replace(/[/\\.#$[\]]/g, "_")
    .replace(/\s+/g, "_");
  return `${listId}__${normalized}`;
}
