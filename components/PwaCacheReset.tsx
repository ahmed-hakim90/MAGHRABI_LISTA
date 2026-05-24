"use client";

import { useEffect } from "react";

const RESET_PARAM = "reset-cache";

/**
 * One-shot PWA reset: ?reset-cache=1 unregisters SW, clears caches, reloads without query.
 */
export function PwaCacheReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(RESET_PARAM) !== "1") return;

    const run = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* best effort */
      }
      const clean = new URL(window.location.href);
      clean.searchParams.delete(RESET_PARAM);
      window.location.replace(clean.pathname + clean.search + clean.hash);
    };

    void run();
  }, []);

  return null;
}
