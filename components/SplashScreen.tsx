"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "in" | "hold" | "out" | "done";

const SPLASH_LOGO_SRC = "/icons/icon-512.png";

/** Min hold so a fast page doesn't snap before the user perceives the splash.
 *  900ms hold + 380ms fade = ~1.28s total minimum — comfortably inside the
 *  brief's 1200-1800ms ideal window. */
const MIN_HOLD_MS = 900;
/** Hard upper bound — splash NEVER stays longer than this even if app is slow.
 *  1800ms cap + 380ms fade = ~2.18s, under the brief's 2200ms absolute max. */
const HARD_CAP_MS = 1800;
/** Fade-out duration must match CSS .splash-overlay transition. */
const FADE_OUT_MS = 380;

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("in");
  const progressFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("splash-launch");

    let rafId = 0;
    let holdToOutTimeout: ReturnType<typeof setTimeout> | undefined;
    let unmountTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let loadResolved = false;
    let loadResolvedAt = 0;
    let progressRaf = 0;

    const now = () =>
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const startedAt = now();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const progressLoop = () => {
      if (cancelled) return;
      const el = progressFillRef.current;
      if (!el) {
        progressRaf = requestAnimationFrame(progressLoop);
        return;
      }
      if (prefersReducedMotion) {
        el.style.transform = "scaleX(1)";
        return;
      }
      const t = now() - startedAt;
      let pct: number;
      if (!loadResolved) {
        pct = Math.min(88, (t / HARD_CAP_MS) * 88);
      } else {
        const dt = now() - loadResolvedAt;
        pct = Math.min(100, 88 + (dt / 220) * 12);
      }
      el.style.transform = `scaleX(${pct / 100})`;
      if (pct < 100) {
        progressRaf = requestAnimationFrame(progressLoop);
      }
    };
    progressRaf = requestAnimationFrame(progressLoop);

    const cleanupListeners = () => {
      window.removeEventListener("load", onAppReady);
    };

    const beginFadeOut = () => {
      if (cancelled) return;
      cleanupListeners();
      if (holdToOutTimeout) clearTimeout(holdToOutTimeout);
      if (hardCapTimeout) clearTimeout(hardCapTimeout);
      const fill = progressFillRef.current;
      if (fill) fill.style.transform = "scaleX(1)";
      setPhase("out");
      unmountTimeout = setTimeout(() => {
        if (cancelled) return;
        setPhase("done");
        document.documentElement.classList.remove("splash-launch");
      }, FADE_OUT_MS + 30);
    };

    const onAppReady = () => {
      if (!loadResolved) {
        loadResolved = true;
        loadResolvedAt = now();
      }
      const elapsed = now() - startedAt;
      const remaining = Math.max(0, MIN_HOLD_MS - elapsed);
      if (holdToOutTimeout) clearTimeout(holdToOutTimeout);
      holdToOutTimeout = setTimeout(beginFadeOut, remaining);
    };

    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        setPhase("hold");
      });
    });

    const inToHoldTimeout = setTimeout(() => {
      if (cancelled) return;
      setPhase((p) => (p === "in" ? "hold" : p));
    }, 60);

    if (document.readyState === "complete") {
      onAppReady();
    } else {
      window.addEventListener("load", onAppReady, { once: true });
    }

    const hardCapTimeout = setTimeout(beginFadeOut, HARD_CAP_MS);

    return () => {
      cancelled = true;
      cancelAnimationFrame(progressRaf);
      cleanupListeners();
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(inToHoldTimeout);
      if (holdToOutTimeout) clearTimeout(holdToOutTimeout);
      clearTimeout(hardCapTimeout);
      if (unmountTimeout) clearTimeout(unmountTimeout);
      document.documentElement.classList.remove("splash-launch");
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="splash-overlay"
      data-phase={phase}
      role="presentation"
      aria-hidden="true"
    >
      <div className="splash-glow" aria-hidden="true" />
      <div className="splash-stack">
        <div className="splash-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SPLASH_LOGO_SRC}
            alt=""
            width={512}
            height={512}
            decoding="async"
            fetchPriority="high"
            draggable={false}
          />
        </div>
        <div className="splash-progress" aria-hidden="true">
          <div className="splash-progress-track">
            <div ref={progressFillRef} className="splash-progress-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
