"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isLikelyIOS,
  isStandaloneDisplay,
  usePwaInstall,
} from "@/hooks/usePwaInstall";

const DISMISSED_KEY = "maghrabi_lista_pwa_install_dismissed";
const IOS_SESSION_KEY = "maghrabi_lista_pwa_ios_prompt_shown_session";
const IOS_DELAY_MS = 10_000;

export const PWA_INSTALL_OPEN_EVENT = "maghrabi-lista-open-pwa-install";

export function openPwaInstallModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PWA_INSTALL_OPEN_EVENT));
}

function isEligiblePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (pathname.startsWith("/folder/")) return true;
  return false;
}

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function PwaInstallModal() {
  const pathname = usePathname();
  const { deferred, hideAsInstalled, busy, runInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const eligible = isEligiblePath(pathname);

  useEffect(() => {
    if (!eligible || hideAsInstalled) return;
    if (!deferred) return;
    if (readDismissed()) return;
    setOpen(true);
  }, [eligible, deferred, hideAsInstalled]);

  useEffect(() => {
    if (!eligible || hideAsInstalled) return;
    if (readDismissed()) return;
    if (!isLikelyIOS()) return;
    if (deferred) return;
    try {
      if (sessionStorage.getItem(IOS_SESSION_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const t = window.setTimeout(() => {
      if (readDismissed() || isStandaloneDisplay()) return;
      try {
        if (sessionStorage.getItem(IOS_SESSION_KEY) === "1") return;
        sessionStorage.setItem(IOS_SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setOpen(true);
    }, IOS_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [eligible, hideAsInstalled, deferred]);

  useEffect(() => {
    const onOpen = () => {
      if (hideAsInstalled || isStandaloneDisplay()) return;
      setOpen(true);
    };
    window.addEventListener(PWA_INSTALL_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(PWA_INSTALL_OPEN_EVENT, onOpen);
  }, [hideAsInstalled]);

  useEffect(() => {
    if (hideAsInstalled) setOpen(false);
  }, [hideAsInstalled]);

  const closeModal = useCallback(() => setOpen(false), []);

  const dismissAuto = useCallback(() => {
    writeDismissed();
    closeModal();
  }, [closeModal]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    });
  }, [open]);

  if (!open || hideAsInstalled) return null;

  const iosNoNativeInstall = isLikelyIOS() && !deferred;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-[#2F3437]/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={() => closeModal()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-modal-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#F7F6F3] shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E2DA] px-5 py-4">
          <h2
            id="pwa-install-modal-title"
            className="text-lg font-semibold text-[#2F3437]"
          >
            تثبيت التطبيق
          </h2>
          <button
            type="button"
            onClick={() => closeModal()}
            className="shrink-0 rounded-lg px-2 py-1 text-2xl leading-none text-[#6B6B6B] transition hover:bg-black/5 hover:text-[#2F3437]"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <p className="text-sm leading-relaxed text-[#6B6B6B]">
            {iosNoNativeInstall
              ? "ثبّت المكتبة على شاشتك الرئيسية للوصول السريع. اضغط الزر أدناه ثم اختر «إضافة إلى الشاشة الرئيسية» من قائمة المشاركة إن ظهرت."
              : "ثبّت التطبيق على جهازك لاستخدام المكتبة كتطبيق سريع مع أيقونة على الشاشة الرئيسية."}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-5 pb-5 pt-0">
          <button
            type="button"
            data-autofocus
            disabled={busy}
            onClick={() => void runInstall().then(() => closeModal())}
            className="w-full rounded-xl bg-[#2F3437] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {busy ? "جاري…" : "تحميل التطبيق"}
          </button>
          <button
            type="button"
            onClick={() => dismissAuto()}
            className="w-full rounded-xl border border-[#E5E2DA] bg-white px-4 py-2.5 text-sm font-medium text-[#2F3437] transition hover:bg-white/90"
          >
            ليس الآن
          </button>
        </div>
      </div>
    </div>
  );
}
