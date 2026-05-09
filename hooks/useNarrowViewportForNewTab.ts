"use client";

import { useEffect, useState } from "react";

/** Below `lg` (1024px), or touch-primary devices (covers iPhone “desktop site” wide viewport). */
const QUERY =
  "(max-width: 1023px), (hover: none) and (pointer: coarse)";

/**
 * True on typical phones/tablets and on touch-first devices.
 * Used so file cards open in a new tab on mobile only (SSR-safe).
 */
export function useNarrowViewportForNewTab(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
}
