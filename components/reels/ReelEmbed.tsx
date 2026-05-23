"use client";

import type { CatalogReelPublic, VideoProvider } from "@/lib/types/reels";
import { PROVIDER_LABELS_AR } from "@/lib/utils/videoEmbed";

type Props = {
  reel: CatalogReelPublic;
  className?: string;
};

function aspectClass(provider: VideoProvider): string {
  if (provider === "youtube" || provider === "drive") {
    return "aspect-video";
  }
  return "aspect-[9/16] max-h-[min(80vh,720px)]";
}

export function ReelEmbed({ reel, className = "" }: Props) {
  if (!reel.embedUrl) return null;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}
    >
      <div className={`relative w-full bg-black ${aspectClass(reel.provider)}`}>
        <iframe
          src={reel.embedUrl}
          title={reel.title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="space-y-1 p-3">
        <h3 className="text-sm font-semibold text-foreground">{reel.title}</h3>
        <p className="text-xs text-muted">
          {PROVIDER_LABELS_AR[reel.provider]}
        </p>
      </div>
    </article>
  );
}
