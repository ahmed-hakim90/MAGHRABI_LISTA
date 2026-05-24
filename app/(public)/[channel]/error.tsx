"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function CatalogChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[catalog-channel]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6 py-16 text-center"
      dir="rtl"
    >
      <h1 className="text-lg font-semibold text-foreground">
        تعذّر تحميل الكتالوج
      </h1>
      <p className="max-w-md text-sm text-muted">
        حدث خطأ أثناء عرض الصفحة. جرّب إعادة التحميل أو تنظيف ذاكرة التطبيق.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          onClick={() => reset()}
        >
          إعادة المحاولة
        </button>
        <Link
          href="/wholesale?reset-cache=1"
          className="text-sm text-primary underline underline-offset-2"
        >
          تنظيف ذاكرة التطبيق (PWA)
        </Link>
      </div>
    </div>
  );
}
