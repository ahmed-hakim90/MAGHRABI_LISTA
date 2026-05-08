"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  cardId: string;
  title: string;
};

export function CatalogPdfViewer({ cardId, title }: Props) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    void fetch("/api/catalog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    }).catch(() => {});
  }, [cardId]);

  const pdfSrc = `/file/${cardId}/pdf`;

  return (
    <div
      className={`flex min-h-dvh flex-col bg-[#0f172a] motion-reduce:opacity-100 ${
        entered ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300 ease-out motion-reduce:transition-none`}
      dir="rtl"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#0f172a]/90 px-safe pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl text-white/90 transition hover:bg-white/10"
          aria-label="رجوع"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-white sm:text-base">
          {title}
        </h1>
        <a
          href={`/file/${cardId}/pdf?download`}
          className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl text-white/90 transition hover:bg-white/10"
          aria-label="تحميل PDF"
          download
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 pb-safe pt-8 text-center">
        <div className="max-w-sm space-y-2 text-white/90">
          <p className="text-base font-semibold leading-snug">
            عرض الملف في تبويب جديد
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            على التليفون والـ PWA، فتح الـ PDF في تبويب منفصل يعرض كل الصفحات
            ويتيح التمرير والتكبير بشكل أوضح.
          </p>
        </div>
        <a
          href={pdfSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-touch w-full max-w-xs items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#0f172a] shadow-lg transition hover:bg-white/95 active:scale-[0.99]"
        >
          فتح PDF
        </a>
        <p className="max-w-xs text-xs text-white/45">
          إذا لم يظهر التبويب، تحقق من حظر النوافذ المنبثقة للموقع.
        </p>
      </div>
    </div>
  );
}
