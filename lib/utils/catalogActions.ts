/** Fire-and-forget view counter used when a catalog PDF is opened. */
export function pingCatalogView(cardId: string) {
  void fetch("/api/catalog/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  }).catch(() => {});
}

export function withDownloadParam(href: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}download`;
}
