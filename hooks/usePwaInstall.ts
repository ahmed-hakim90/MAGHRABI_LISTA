"use client";

import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Set when the user completes install (accepted prompt or `appinstalled`). */
export const PWA_USER_INSTALLED_KEY = "maghrabi_lista_pwa_user_installed";

export function readPwaUserInstalledMarker(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PWA_USER_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePwaUserInstalledMarker() {
  try {
    window.localStorage.setItem(PWA_USER_INSTALLED_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Sync every `usePwaInstall()` instance after install (each hook has its own state). */
export const PWA_INSTALLED_SYNC_EVENT = "maghrabi-lista-pwa-installed";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  for (const mode of ["standalone", "fullscreen", "minimal-ui"] as const) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return true;
  }
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
    const syncHideFromEnvironment = () => {
      if (isStandaloneDisplay() || readPwaUserInstalledMarker()) {
        setHideAsInstalled(true);
      }
    };

    syncHideFromEnvironment();

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferred(null);
      writePwaUserInstalledMarker();
      setHideAsInstalled(true);
      window.dispatchEvent(new Event(PWA_INSTALLED_SYNC_EVENT));
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === PWA_USER_INSTALLED_KEY && e.newValue === "1") {
        syncHideFromEnvironment();
      }
    };

    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener(PWA_INSTALLED_SYNC_EVENT, syncHideFromEnvironment);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", syncHideFromEnvironment);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener(
        PWA_INSTALLED_SYNC_EVENT,
        syncHideFromEnvironment,
      );
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", syncHideFromEnvironment);
    };
  }, []);

  const runInstall = useCallback(async () => {
    if (hideAsInstalled || isStandaloneDisplay()) return;
    setBusy(true);
    try {
      if (deferred) {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        setDeferred(null);
        if (outcome === "accepted") {
          writePwaUserInstalledMarker();
          setHideAsInstalled(true);
          window.dispatchEvent(new Event(PWA_INSTALLED_SYNC_EVENT));
        }
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
