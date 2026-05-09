import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogChannelRoot } from "./CatalogChannelRoot";
import {
  isCatalogChannelSegment,
  manifestPathForChannelSegment,
  pwaAppleWebAppTitleForChannelSegment,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";

type Props = {
  children: React.ReactNode;
  params: Promise<{ channel: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channel: raw } = await params;
  if (!isCatalogChannelSegment(raw)) return {};
  const channel = raw as CatalogChannelSegment;
  return {
    manifest: manifestPathForChannelSegment(channel),
    appleWebApp: {
      capable: true,
      title: pwaAppleWebAppTitleForChannelSegment(channel),
      statusBarStyle: "default",
    },
  };
}

export default async function CatalogChannelLayout({
  children,
  params,
}: Props) {
  const { channel: raw } = await params;
  if (!isCatalogChannelSegment(raw)) notFound();
  const channel = raw as CatalogChannelSegment;
  return <CatalogChannelRoot channel={channel}>{children}</CatalogChannelRoot>;
}
