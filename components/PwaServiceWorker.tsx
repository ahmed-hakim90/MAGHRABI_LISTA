"use client";

import { useEffect } from "react";

/** Registers the app service worker so the site is installable as a PWA (and FCM can reuse the same registration). */
export function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
