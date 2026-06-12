import "server-only";

import type { CatalogCardGateOk } from "@/lib/server/catalogCardGate";

const PDF_REDIRECT_CACHE_CONTROL =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function serveCatalogPdfFromGate(
  _req: Request,
  gate: CatalogCardGateOk,
  _cardId: string,
): Promise<Response> {
  void _cardId;
  try {
    const target = new URL(gate.fileUrl);
    if (target.protocol !== "https:") {
      return new Response("Invalid upstream", { status: 502 });
    }
    return new Response(null, {
      status: 307,
      headers: {
        Location: target.toString(),
        "Cache-Control": PDF_REDIRECT_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Invalid upstream", { status: 502 });
  }
}
