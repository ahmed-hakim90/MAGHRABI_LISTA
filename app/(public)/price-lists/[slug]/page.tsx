import { notFound, redirect } from "next/navigation";
import { findActivePriceListBySlug } from "@/lib/server/priceLists";
import { publicPriceListPath } from "@/lib/constants/catalogChannels";

type Props = { params: Promise<{ slug: string }> };

/** Legacy URL → redirect to the correct channel link. */
export default async function LegacyPriceListSlugRedirect({ params }: Props) {
  const { slug } = await params;
  const list = await findActivePriceListBySlug(slug).catch(() => null);
  if (!list) notFound();
  redirect(publicPriceListPath(list.audience, list.slug));
}
