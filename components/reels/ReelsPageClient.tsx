"use client";

import { useSearchParams } from "next/navigation";
import type { CatalogReelPublic } from "@/lib/types/reels";
import { ReelsFeed } from "./ReelsFeed";

type Props = {
  reels: CatalogReelPublic[];
  backHref: string;
};

export function ReelsPageClient({ reels, backHref }: Props) {
  const searchParams = useSearchParams();
  const initialReelId = searchParams.get("id") ?? undefined;

  return (
    <ReelsFeed
      reels={reels}
      backHref={backHref}
      initialReelId={initialReelId}
    />
  );
}
