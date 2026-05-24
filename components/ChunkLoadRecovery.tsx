"use client";

import { useCallback, useEffect, useState } from "react";

const RELOAD_FLAG_KEY = "maghrabi-chunk-reload-v1";

function isChunkLoadFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("chunkloaderror") ||
    m.includes("loading chunk") ||
    m.includes("failed to fetch dynamically imported module")
  );
}

function messageFromUnknown(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return String(reason ?? "");
}

/**
 * Auto-reload once on stale Next.js chunks after deploy; then show a recovery banner.
 */
export function ChunkLoadRecovery() {
  const [showBanner, setShowBanner] = useState(false);

  const clearFlagAndReload = useCallback(() => {
    try {
      localStorage.removeItem(RELOAD_FLAG_KEY);
    } catch {
      /* private mode */
    }
    window.location.reload();
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem(RELOAD_FLAG_KEY);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    const handleFailure = (raw: string) => {
      if (!isChunkLoadFailure(raw)) return;
      try {
        if (!localStorage.getItem(RELOAD_FLAG_KEY)) {
          localStorage.setItem(RELOAD_FLAG_KEY, "1");
          window.location.reload();
          return;
        }
      } catch {
        /* fall through to banner */
      }
      setShowBanner(true);
    };

    const onError = (event: ErrorEvent) => {
      const parts = [
        event.message,
        event.error instanceof Error ? event.error.message : "",
      ].filter(Boolean);
      handleFailure(parts.join(" "));
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      handleFailure(messageFromUnknown(event.reason));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[210] border-b border-black/10 bg-[#F7F6F3] px-4 py-3 text-center shadow-sm"
      dir="rtl"
      role="alert"
    >
      <p className="text-sm text-neutral-800">
        تم تحديث الموقع، برجاء إعادة فتح الصفحة
      </p>
      <button
        type="button"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        onClick={clearFlagAndReload}
      >
        إعادة التحميل
      </button>
    </div>
  );
}
