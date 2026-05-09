"use client";

import { useEffect, useState } from "react";

const QUERY = "(max-width: 639px)";

/**
 * True when the viewport is below Tailwind's default `sm` breakpoint.
 * Used so file cards open in a new tab on phone-sized layouts only (SSR-safe).
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
