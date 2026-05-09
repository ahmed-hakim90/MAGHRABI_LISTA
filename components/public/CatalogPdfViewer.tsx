"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";

type Props = {
  cardId: string;
  title: string;
};

export function CatalogPdfViewer({ cardId, title }: Props) {
  const router = useRouter();
  const { basePath } = useCatalogChannel();
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

  const pdfSrc = `${basePath}/file/${cardId}/pdf`;

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
              router.push(basePath);
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
          href={`${pdfSrc}?download`}
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
      <div className="relative min-h-0 w-full flex-1 bg-[#0b1220] pb-[max(0px,env(safe-area-inset-bottom))]">
        <iframe
          src={pdfSrc}
          title={title}
          className="absolute inset-0 h-full w-full border-0 bg-[#0b1220]"
        />
      </div>
    </div>
  );
}
