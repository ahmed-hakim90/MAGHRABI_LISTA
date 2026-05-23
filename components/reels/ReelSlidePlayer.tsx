"use client";

import type { CatalogReelPublic } from "@/lib/types/reels";
import {
  embedUrlForPlayback,
  PROVIDER_LABELS_AR,
} from "@/lib/utils/videoEmbed";
import { ReelLikeButton } from "./ReelLikeButton";

type Props = {
  reel: CatalogReelPublic;
  active: boolean;
  liked: boolean;
  withSound: boolean;
  onRequestSound: () => void;
  showSoundHint: boolean;
};

export function ReelSlidePlayer({
  reel,
  active,
  liked,
  withSound,
  onRequestSound,
  showSoundHint,
}: Props) {
  const src = active
    ? embedUrlForPlayback(reel.embedUrl, reel.provider, true, withSound)
    : "";

  return (
    <div className="relative h-full w-full bg-black">
      {active && src ? (
        <iframe
          key={`${reel.id}-${withSound ? "sound" : "mute"}`}
          src={src}
          title={reel.title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="absolute inset-0 bg-black" aria-hidden />
      )}

      {active && showSoundHint && !withSound ? (
        <button
          type="button"
          onClick={onRequestSound}
          className="absolute inset-0 z-[15] flex items-center justify-center bg-black/35"
        >
          <span className="rounded-full bg-black/60 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm">
            اضغط لتشغيل الصوت
          </span>
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          {PROVIDER_LABELS_AR[reel.provider]}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-14 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <h2 className="line-clamp-3 text-base font-bold leading-snug text-white drop-shadow">
          {reel.title}
        </h2>
      </div>

      <div className="absolute bottom-20 right-3 z-20 flex flex-col items-center gap-4">
        <ReelLikeButton
          reelId={reel.id}
          initialCount={reel.likeCount}
          initialLiked={liked}
        />
      </div>
    </div>
  );
}
