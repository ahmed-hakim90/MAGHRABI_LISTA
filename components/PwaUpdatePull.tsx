"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SW_PATH = "/sw.js";
const PULL_THRESHOLD_PX = 72;

function syncWaitingBanner(
  reg: ServiceWorkerRegistration | undefined,
  setShow: (v: boolean) => void,
) {
  if (!reg?.waiting || !navigator.serviceWorker.controller) {
    setShow(false);
    return;
  }
  setShow(true);
}

/** Registers the app service worker, surfaces updates, and supports pull-to-activate. */
export function PwaUpdatePull() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const pendingReloadRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const trackingPullRef = useRef(false);

  const applyWaitingUpdate = useCallback(() => {
    const w = regRef.current?.waiting;
    if (!w) return;
    pendingReloadRef.current = true;
    w.postMessage({ type: "SKIP_WAITING" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const onControllerChange = () => {
      if (!pendingReloadRef.current) return;
      pendingReloadRef.current = false;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.register(SW_PATH).then((reg) => {
      if (cancelled) return;
      regRef.current = reg;
      syncWaitingBanner(reg, setShowUpdateBanner);

      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed") {
            syncWaitingBanner(reg, setShowUpdateBanner);
          }
        });
      });
    });

    const checkForUpdate = () => {
      void navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) void reg.update();
      });
    };

    const onVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    };
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    window.addEventListener("focus", onVisibleOrFocus);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
      window.removeEventListener("focus", onVisibleOrFocus);
    };
  }, []);

  useEffect(() => {
    if (!showUpdateBanner || typeof window === "undefined") return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      touchStartYRef.current = e.touches[0].clientY;
      trackingPullRef.current = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!trackingPullRef.current || touchStartYRef.current === null) {
        trackingPullRef.current = false;
        return;
      }
      trackingPullRef.current = false;
      if (window.scrollY > 0) {
        touchStartYRef.current = null;
        return;
      }
      const y = e.changedTouches[0].clientY;
      const dy = y - touchStartYRef.current;
      touchStartYRef.current = null;
      if (dy >= PULL_THRESHOLD_PX) {
        applyWaitingUpdate();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [showUpdateBanner, applyWaitingUpdate]);

  if (!showUpdateBanner) return null;

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[200] border-b border-black/10 bg-[#F7F6F3] px-4 py-3 text-center shadow-sm"
      dir="rtl"
      role="status"
    >
      <p className="text-sm text-neutral-800">
        يتوفر تحديث للتطبيق. اسحب للأسفل لتحديث الصفحة، أو اضغط الزر أدناه.
      </p>
      <button
        type="button"
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        onClick={applyWaitingUpdate}
      >
        تحديث الآن
      </button>
    </div>
  );
}
