import { notFound } from "next/navigation";
import { CatalogPdfViewer } from "@/components/public/CatalogPdfViewer";
import {
  CHANNEL_TO_AUDIENCE,
  isCatalogChannelSegment,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import { getActiveCardForCatalogAudience } from "@/lib/server/catalogCardGate";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ channel: string; cardId: string }>;
};

export default async function ChannelFileViewPage({ params }: Props) {
  const { channel: raw, cardId } = await params;
  if (!isCatalogChannelSegment(raw)) notFound();
  const channel = raw as CatalogChannelSegment;
  const routeAudience = CHANNEL_TO_AUDIENCE[channel];
  const gate = await getActiveCardForCatalogAudience(cardId, routeAudience);
  if (!gate.ok) notFound();
  return <CatalogPdfViewer cardId={cardId} title={gate.title} />;
}
