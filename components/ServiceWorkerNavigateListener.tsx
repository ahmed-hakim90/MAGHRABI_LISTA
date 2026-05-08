"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ServiceWorkerNavigateListener() {
  const router = useRouter();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const d = event.data;
      if (d && d.type === "NAVIGATE" && typeof d.path === "string") {
        router.push(d.path);
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}
