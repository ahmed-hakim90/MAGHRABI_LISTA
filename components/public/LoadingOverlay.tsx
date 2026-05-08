"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  /** Shown under the spinner */
  message?: string;
};

export function LoadingOverlay({
  open,
  message = "جاري تحميل المكتبة…",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F3437]/20 p-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="loading-overlay-message"
    >
      <div
        className="flex min-w-[200px] max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#E5E2DA] bg-white px-8 py-7 shadow-lg"
        dir="rtl"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E5E2DA] border-t-[#2F3437]"
          aria-hidden
        />
        <p
          id="loading-overlay-message"
          className="text-center text-[15px] font-medium text-[#2F3437]"
        >
          {message}
        </p>
      </div>
    </div>
  );
}
