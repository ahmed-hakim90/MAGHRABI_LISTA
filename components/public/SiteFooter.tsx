"use client";

import { usePathname } from "next/navigation";

const PORTFOLIO_URL = "https://portfolio-flame-tau-19.vercel.app/";

const FILE_VIEW_PATH =
  /^\/(wholesale|retail|lists)\/file\/[^/]+\/view$/;

import { shouldHideFloatingCatalogButtons } from "@/lib/utils/catalogChrome";
import { BrandLogo, BrandPattern } from "@/components/public/BrandSystem";

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#91050f] py-10 text-white sm:py-14" role="contentinfo">
      <BrandPattern />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div dir="rtl">
          <BrandLogo light className="h-16 w-44" />
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">شريكك الموثوق في عالم الأجهزة والتوزيع.</p>
        </div>
        <div className="text-start sm:text-end">
          <p className="text-xs uppercase tracking-[0.2em] text-[#fff2e3]/70">EL MAGHRABY GROUP</p>
          <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-touch items-center gap-1 text-xs text-white/75 underline-offset-2 transition hover:text-white hover:underline">
            <span>صُنع بـ</span><HeartIcon className="size-3 text-[#c4a642]" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export function PublicSiteFooterGate() {
  const pathname = usePathname();
  if (FILE_VIEW_PATH.test(pathname) || shouldHideFloatingCatalogButtons(pathname)) {
    return null;
  }
  return <SiteFooter />;
}
