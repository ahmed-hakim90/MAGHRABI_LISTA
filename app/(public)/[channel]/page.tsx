import { notFound } from "next/navigation";
import { CatalogChannelHomeClient } from "./CatalogChannelHomeClient";
import {
  CATALOG_CHANNEL_SEGMENTS,
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

export const revalidate = 300;

export function generateStaticParams() {
  return CATALOG_CHANNEL_SEGMENTS.map((channel) => ({ channel }));
}

export default async function CatalogChannelHomePage({ params }: Props) {
  const { channel: raw } = await params;
  if (!isCatalogChannelSegment(raw)) notFound();
  const channel = raw as CatalogChannelSegment;
  const data = await getCachedPublicCatalog(CHANNEL_TO_AUDIENCE[channel]);

  return (
    <CatalogChannelHomeClient
      initialCards={data.cards}
      initialFolders={data.folders}
      initialError={data.error}
    />
  );
}
