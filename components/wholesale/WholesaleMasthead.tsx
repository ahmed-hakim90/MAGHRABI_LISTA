"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  requestOpenExhibitionInvite,
  useExhibitionInviteAvailable,
} from "@/lib/utils/exhibitionInviteChannel";

type CampaignSlide = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Opens the exhibition registration dialog while an invitation is active. */
  opensExhibitionInvite?: boolean;
};

const CAMPAIGN_SLIDES: CampaignSlide[] = [
  {
    id: "sokany-home-appliances",
    src: "/campaigns/sokany-home-appliances.jpg",
    alt: "أجهزة منزلية سوكاني والمغربي — رغم غلاء الأسعار مكملين معاك بنفس الأسعار، أسعار الجملة متاحة الآن",
    width: 1024,
    height: 341,
  },
  {
    id: "ramadan-2027-exhibition",
    src: "/campaigns/ramadan-2027-exhibition-annual.jpg",
    alt: "المغربي شركاء النجاح — المعرض السنوي لتشكيلات وإضاءات رمضان 2027، دعوة خاصة لتجار الجملة",
    width: 1024,
    height: 341,
    opensExhibitionInvite: true,
  },
];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

function subscribeReducedMotion(notify: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

/**
 * Wholesale home campaign carousel. One 3:1 frame at every width keeps all
 * slides the same height; narrower artwork (2:1) is shown whole at full height
 * with blurred side panels instead of being cropped.
 * Autoplay pauses on hover/focus, in background tabs, via the pause button,
 * and is off entirely for reduced-motion users.
 */
export function WholesaleMasthead() {
  const slides = CAMPAIGN_SLIDES;
  const count = slides.length;
  const inviteAvailable = useExhibitionInviteAvailable();
  const [index, setIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );

  const goTo = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  const autoplay =
    count > 1 && !prefersReducedMotion && !userPaused && !interacting && pageVisible;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [autoplay, index, count]);

  function startSwipe(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  }

  function endSwipe(e: React.PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || count < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    swiped.current = true;
    // In RTL the next slide enters from the left, so dragging right advances.
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    goTo(index + ((dx > 0) === rtl ? 1 : -1));
  }

  return (
    <section
      className="relative bg-black"
      aria-roledescription="carousel"
      aria-label="عروض وحملات المغربي"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setInteracting(false);
        }
      }}
    >
      <div
        className="relative mx-auto aspect-[3/1] w-full max-w-[1320px] touch-pan-y select-none overflow-hidden"
        onPointerDown={startSwipe}
        onPointerUp={endSwipe}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      >
        <div
          className="flex h-full translate-x-[calc(var(--slide)*-100%)] transition-transform duration-700 ease-out motion-reduce:transition-none rtl:translate-x-[calc(var(--slide)*100%)]"
          style={{ "--slide": index } as React.CSSProperties}
          aria-live={autoplay ? "off" : "polite"}
        >
          {slides.map((slide, i) => {
            const active = i === index;
            const interactive = Boolean(slide.opensExhibitionInvite && inviteAvailable);
            const artwork = (
              <>
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  aria-hidden
                  sizes="(min-width: 1320px) 1320px, 100vw"
                  className="scale-110 object-cover opacity-60 blur-2xl"
                />
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1320px) 1320px, 100vw"
                  className="object-contain"
                  draggable={false}
                />
              </>
            );
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} من ${count}`}
                aria-hidden={!active}
                inert={!active}
                className="relative h-full w-full shrink-0 overflow-hidden"
              >
                {interactive ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (swiped.current) return;
                      requestOpenExhibitionInvite();
                    }}
                    aria-label={`${slide.alt} — سجّل حضورك`}
                    className="absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-gold"
                  >
                    {artwork}
                  </button>
                ) : (
                  artwork
                )}
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="العرض السابق"
              className="absolute start-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white sm:flex"
            >
              <ChevronGlyph className="h-5 w-5 rotate-180 rtl:rotate-0" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="العرض التالي"
              className="absolute end-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white sm:flex"
            >
              <ChevronGlyph className="h-5 w-5 rtl:rotate-180" />
            </button>

            <div className="absolute bottom-1 end-2 flex items-center gap-0.5 rounded-full bg-black/25 px-1 backdrop-blur-sm sm:bottom-3 sm:end-4">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`عرض ${i + 1} من ${count}`}
                  aria-current={i === index ? "true" : undefined}
                  className="flex h-6 w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
                >
                  <span
                    className={`block h-2 rounded-full shadow ring-1 ring-black/20 transition-all duration-300 ${
                      i === index ? "w-5 bg-white" : "w-2 bg-white/60"
                    }`}
                  />
                </button>
              ))}
              {!prefersReducedMotion ? (
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? "تشغيل العرض التلقائي" : "إيقاف العرض التلقائي"}
                  className="ms-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white focus-visible:outline-2 focus-visible:outline-white"
                >
                  {userPaused ? <PlayGlyph className="h-3 w-3" /> : <PauseGlyph className="h-3 w-3" />}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function ChevronGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function PauseGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
    </svg>
  );
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
