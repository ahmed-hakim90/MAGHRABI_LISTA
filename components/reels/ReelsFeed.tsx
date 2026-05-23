"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogReelPublic } from "@/lib/types/reels";
import { syncLocalLikedFromFirestore } from "@/lib/services/reelLikes";
import { ReelSlidePlayer } from "./ReelSlidePlayer";
import { ReelSoundButton } from "./ReelSoundButton";

type Props = {
  reels: CatalogReelPublic[];
  backHref: string;
  initialReelId?: string;
};

export function ReelsFeed({ reels, backHref, initialReelId }: Props) {
  const initialIndex = useMemo(() => {
    if (!initialReelId) return 0;
    const i = reels.findIndex((r) => r.id === initialReelId);
    return i >= 0 ? i : 0;
  }, [reels, initialReelId]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const withSound = audioUnlocked && !muted;
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    void syncLocalLikedFromFirestore(reels.map((r) => r.id)).then(setLikedSet);
  }, [reels]);

  useEffect(() => {
    const el = slideRefs.current[initialIndex];
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
    }
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.index ?? -1,
          );
          if (index < 0) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
        if (best && best.ratio >= 0.6) {
          setActiveIndex((prev) => (prev === best!.index ? prev : best!.index));
        }
      },
      { root, threshold: [0.55, 0.75, 0.9] },
    );

    slideRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [reels.length]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(reels.length - 1, index));
    slideRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveIndex(clamped);
  }, [reels.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goTo(activeIndex + 1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(activeIndex - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <Link
        href={backHref}
        className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        aria-label="رجوع"
      >
        ←
      </Link>

      <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center gap-2">
        <ReelSoundButton
          muted={!withSound}
          onToggle={() => {
            if (!audioUnlocked) setAudioUnlocked(true);
            setMuted((m) => !m);
          }}
        />
        <p className="text-xs font-medium text-white/90">
          {activeIndex + 1} / {reels.length}
        </p>
      </div>

      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth [-webkit-overflow-scrolling:touch]"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {reels.map((reel, index) => (
          <section
            key={reel.id}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            data-index={index}
            className="relative h-dvh w-full shrink-0 snap-start snap-always"
          >
            <ReelSlidePlayer
              reel={reel}
              active={activeIndex === index}
              liked={likedSet.has(reel.id)}
              withSound={withSound}
              showSoundHint={!audioUnlocked}
              onRequestSound={() => {
                setAudioUnlocked(true);
                setMuted(false);
              }}
            />
          </section>
        ))}
      </div>

      {activeIndex < reels.length - 1 ? (
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"
        >
          الريلز التالية ↓
        </button>
      ) : null}
    </div>
  );
}
