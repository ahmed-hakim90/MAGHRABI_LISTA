"use client";

import Link from "next/link";
import type { CatalogReelPublic } from "@/lib/types/reels";
import { PROVIDER_LABELS_AR } from "@/lib/utils/videoEmbed";

type Props = {
  reels: CatalogReelPublic[];
  viewAllHref?: string;
  compact?: boolean;
  showHeading?: boolean;
};

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function ReelsGrid({
  reels,
  viewAllHref,
  compact = false,
  showHeading = true,
}: Props) {
  if (reels.length === 0) return null;

  if (compact) {
    return (
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          {showHeading ? (
            <h2 className="text-sm font-semibold text-foreground">ريلز</h2>
          ) : (
            <span />
          )}
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-xs font-medium text-primary hover:underline"
            >
              فتح الكل ({reels.length})
            </Link>
          ) : null}
        </div>
        <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 snap-x snap-mandatory">
          {reels.slice(0, 12).map((reel) => (
            <Link
              key={reel.id}
              href={
                viewAllHref
                  ? `${viewAllHref}?id=${encodeURIComponent(reel.id)}`
                  : "#"
              }
              className="group relative w-[7.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border-2 border-[#ca8a04]/60 bg-black shadow-md sm:w-[8.5rem]"
            >
              <div className="flex aspect-[9/16] flex-col justify-end bg-gradient-to-b from-[#333] to-black p-2">
                <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
                  {reel.title}
                </p>
                <p className="mt-1 text-[9px] text-white/70">
                  {PROVIDER_LABELS_AR[reel.provider]}
                  {reel.likeCount > 0
                    ? ` · ♥ ${formatLikes(reel.likeCount)}`
                    : ""}
                </p>
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-3xl text-white/90 transition group-active:scale-95">
                ▶
              </span>
            </Link>
          ))}
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="flex w-full items-center justify-center rounded-xl bg-[#FACC15] py-3 text-sm font-bold text-[#1a1a1a]"
          >
            شاهد الريلز — اسحب للأعلى
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mb-6 space-y-3">
      <h2 className="px-1 text-sm font-semibold text-foreground">ريلز</h2>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="flex w-full items-center justify-center rounded-xl bg-[#FACC15] py-4 text-base font-bold text-[#1a1a1a]"
        >
          فتح تجربة الريلز ({reels.length})
        </Link>
      ) : null}
    </section>
  );
}
