import { notFound } from "next/navigation";
import { CatalogChannelHomeClient } from "./CatalogChannelHomeClient";
import { WholesaleCatalogHomeClient } from "@/components/wholesale/WholesaleCatalogHomeClient";
import {
  CHANNEL_TO_AUDIENCE,
  isCatalogChannelSegment,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import {
  getCachedPublicCatalog,
} from "@/lib/server/publicCatalogData";

type Props = {
  params: Promise<{ channel: string }>;
};

/** Fetch catalog at request time so the first HTML includes cards, not an empty SSG shell. */
export const dynamic = "force-dynamic";

export default async function CatalogChannelHomePage({ params }: Props) {
  const { channel: raw } = await params;
  if (!isCatalogChannelSegment(raw)) notFound();
  const channel = raw as CatalogChannelSegment;
  const data = await getCachedPublicCatalog(CHANNEL_TO_AUDIENCE[channel]);

  if (channel === "wholesale") {
    return (
      <WholesaleCatalogHomeClient
        initialCards={data.cards}
        initialFolders={data.folders}
        initialError={data.error}
      />
    );
  }

  return (
    <CatalogChannelHomeClient
      initialCards={data.cards}
      initialFolders={data.folders}
      initialError={data.error}
    />
  );
}
