import {
  CHANNEL_TO_AUDIENCE,
  isCatalogChannelSegment,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import { getActiveCardForCatalogAudience } from "@/lib/server/catalogCardGate";
import { serveCatalogPdfFromGate } from "@/lib/server/serveCatalogPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channel: string; cardId: string }> },
) {
  const { channel: raw, cardId } = await params;
  if (!isCatalogChannelSegment(raw)) {
    return new Response("Not found", { status: 404 });
  }
  const routeAudience = CHANNEL_TO_AUDIENCE[raw as CatalogChannelSegment];
  const gate = await getActiveCardForCatalogAudience(cardId, routeAudience);
  if (!gate.ok) {
    return new Response("Not found", { status: 404 });
  }
  return serveCatalogPdfFromGate(req, gate, cardId);
}
