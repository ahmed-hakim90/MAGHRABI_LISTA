"use client";

import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone) ===
    true
  );
}

export function isLikelyIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) return true;
  return (
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  );
}

/** iOS WebViews / in-app browsers often block Add-to-Home-Screen; Safari works. */
function isLikelyIOSInAppBrowser(): boolean {
  if (!isLikelyIOS()) return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|Snapchat|GSA\/|GoogleApp|TikTok/i.test(
    ua,
  );
}

function tryOpenCurrentUrlInNewWindow(): boolean {
  const url = window.location.href;
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) return false;
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  return true;
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hideAsInstalled, setHideAsInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHideAsInstalled(isStandaloneDisplay());
  }, []);

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHideAsInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const runInstall = useCallback(async () => {
    if (hideAsInstalled || isStandaloneDisplay()) return;
    setBusy(true);
    try {
      if (deferred) {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
        return;
      }
      if (isLikelyIOS()) {
        if (isLikelyIOSInAppBrowser() && tryOpenCurrentUrlInNewWindow()) {
          return;
        }
        if (navigator.share) {
          try {
            await navigator.share({
              title: document.title,
              text: "اختر «إضافة إلى الشاشة الرئيسية» من القائمة لتثبيت المكتبة كأيقونة.",
              url: window.location.href,
            });
          } catch {
            /* cancelled */
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(window.location.href);
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  }, [deferred, hideAsInstalled]);

  return { deferred, hideAsInstalled, busy, runInstall };
}
