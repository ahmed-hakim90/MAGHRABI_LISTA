"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useFcmToken } from "@/hooks/useFcmToken";

const AUTO_DELAY_MS = 4800;

function isEligiblePath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (
    pathname.startsWith("/wholesale") ||
    pathname.startsWith("/retail") ||
    pathname.startsWith("/lists")
  ) {
    return true;
  }
  return false;
}

export function NotificationPromptModal() {
  const pathname = usePathname();
  const { audience } = useCatalogChannel();
  const { status, message, registerAndSaveToken } = useFcmToken(audience);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const eligible = isEligiblePath(pathname);

  useEffect(() => {
    if (!eligible || !pathname) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      queueMicrotask(() => setOpen(false));
      return;
    }

    const t = window.setTimeout(() => setOpen(true), AUTO_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [eligible, pathname]);

  useEffect(() => {
    if (status === "granted") queueMicrotask(() => setOpen(false));
  }, [status]);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

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

  const onEnable = useCallback(() => {
    void registerAndSaveToken();
  }, [registerAndSaveToken]);

  if (!open) return null;

  const permission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied";

  const denied = permission === "denied";
  const busy = status === "requesting";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[#2F3437]/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={() => closeModal()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#F7F6F3] shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E2DA] px-5 py-4">
          <h2
            id="notification-modal-title"
            className="text-lg font-semibold text-[#2F3437]"
          >
            تفعيل الإشعارات
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
            {denied
              ? "تم رفض الإشعارات سابقًا. لتلقي تنبيهات بالملفات الجديدة، افتح إعدادات المتصفح واسمح بالإشعارات لهذا الموقع."
              : "فعّل الإشعارات ليصلك تنبيه عند إضافة ملفات جديدة إلى المكتبة."}
          </p>
          {message ? (
            <p
              className={`text-sm ${status === "error" || status === "denied" ? "text-red-800" : "text-[#2F3437]"}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 px-5 pb-5 pt-0">
          {!denied ? (
            <button
              type="button"
              data-autofocus
              disabled={busy || status === "granted"}
              onClick={() => onEnable()}
              className="w-full rounded-xl bg-[#2F3437] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {busy ? "جاري التفعيل…" : "تفعيل الإشعارات"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => closeModal()}
            className="w-full rounded-xl border border-[#E5E2DA] bg-white px-4 py-2.5 text-sm font-medium text-[#2F3437] transition hover:bg-white/90"
          >
            ليس الآن
          </button>
        </div>
      </div>
    </div>
  );
}
