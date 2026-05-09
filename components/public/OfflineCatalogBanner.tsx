"use client";

type Props = {
  offline: boolean;
  stale: boolean;
};

export function OfflineCatalogBanner({ offline, stale }: Props) {
  if (!offline && !stale) return null;

  const text = offline
    ? "بدون اتصال بالإنترنت — يُعرض آخر كتالوج تم تحميله على هذا الجهاز."
    : "تعذر مزامنة الكتالوج — يُعرض آخر نسخة محفوظة على هذا الجهاز.";

  return (
    <div
      className="border-b border-amber-200/80 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950"
      dir="rtl"
      role="status"
    >
      {text}
    </div>
  );
}
