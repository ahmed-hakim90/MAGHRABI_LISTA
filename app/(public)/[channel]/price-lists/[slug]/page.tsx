import { notFound } from "next/navigation";
import {
  CHANNEL_TO_AUDIENCE,
  isCatalogChannelSegment,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import {
  getActiveItemsForList,
  getActivePriceListBySlug,
} from "@/lib/server/priceLists";
import { PriceListView } from "@/components/price-lists/PriceListView";
import type { PriceListItemPublic } from "@/lib/types/priceList";

type Props = {
  params: Promise<{ channel: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { channel: raw, slug } = await params;
  if (!isCatalogChannelSegment(raw)) return { title: "قائمة أسعار" };
  const audience = CHANNEL_TO_AUDIENCE[raw as CatalogChannelSegment];
  const list = await getActivePriceListBySlug(slug, audience).catch(() => null);
  return { title: list?.name ?? "قائمة أسعار" };
}

export default async function ChannelPriceListSlugPage({ params }: Props) {
  const { channel: raw, slug } = await params;
  if (!isCatalogChannelSegment(raw)) notFound();
  const audience = CHANNEL_TO_AUDIENCE[raw as CatalogChannelSegment];

  let list;
  try {
    list = await getActivePriceListBySlug(slug, audience);
  } catch {
    notFound();
  }
  if (!list) notFound();

  let items: PriceListItemPublic[] = [];
  try {
    items = await getActiveItemsForList(list.id);
  } catch {
    items = [];
  }

  return <PriceListView list={list} items={items} />;
}
