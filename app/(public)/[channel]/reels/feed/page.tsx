import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  CHANNEL_TO_AUDIENCE,
  isCatalogChannelSegment,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import { ReelsPageClient } from "@/components/reels/ReelsPageClient";
import { getActiveReelsForAudience } from "@/lib/server/reels";
import type { CatalogReelPublic } from "@/lib/types/reels";

type Props = {
  params: Promise<{ channel: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { channel: raw } = await params;
  if (!isCatalogChannelSegment(raw)) return { title: "ريلز" };
  return { title: "ريلز" };
}

export default async function ChannelReelsFeedPage({ params }: Props) {
  const { channel: raw } = await params;
  if (!isCatalogChannelSegment(raw)) notFound();
  const channel = raw as CatalogChannelSegment;
  const audience = CHANNEL_TO_AUDIENCE[channel];

  let reels: CatalogReelPublic[] = [];
  try {
    reels = await getActiveReelsForAudience(audience);
  } catch {
    reels = [];
  }

  if (reels.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white">
        <p className="text-lg">لا توجد ريلز حاليًا</p>
        <a
          href={`/${channel}/reels`}
          className="mt-4 text-sm text-[#FACC15] underline"
        >
          العودة للفيديوهات
        </a>
      </div>
    );
  }

  return (
    <Suspense
      fallback={<div className="h-dvh bg-black" aria-label="جاري التحميل" />}
    >
      <ReelsPageClient
        reels={reels}
        backHref={`/${channel}/reels`}
      />
    </Suspense>
  );
}
