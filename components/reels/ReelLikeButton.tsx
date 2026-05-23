"use client";

import { useCallback, useState } from "react";
import { toggleReelLike, isReelLikedLocally } from "@/lib/services/reelLikes";

type Props = {
  reelId: string;
  initialCount: number;
  initialLiked?: boolean;
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ReelLikeButton({
  reelId,
  initialCount,
  initialLiked,
}: Props) {
  const [liked, setLiked] = useState(
    initialLiked ?? isReelLikedLocally(reelId),
  );
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  const onToggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await toggleReelLike(reelId);
      setLiked(next.liked);
      setCount(next.likeCount);
      if (next.liked) {
        setPop(true);
        window.setTimeout(() => setPop(false), 400);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }, [busy, reelId]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onToggle()}
      className="flex flex-col items-center gap-1 text-white drop-shadow-md disabled:opacity-60"
      aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"}
      aria-pressed={liked}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform ${
          pop ? "scale-125" : "scale-100"
        } ${liked ? "text-red-500" : "text-white"}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </span>
      <span className="text-xs font-semibold tabular-nums">
        {formatCount(count)}
      </span>
    </button>
  );
}
