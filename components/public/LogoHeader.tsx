"use client";

import Image from "next/image";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { DEFAULT_SITE_HOME_TITLE } from "@/lib/constants/siteDefaults";

type Props = {
  appName: string;
  logoUrl?: string;
  homeTitle: string;
  homeSubtitle: string;
  /** Accent for the main title; saved in site settings */
  primaryColor?: string;
};

export function LogoHeader({
  appName,
  logoUrl,
  homeTitle,
  homeSubtitle,
  primaryColor = "#2F3437",
}: Props) {
  const { hideAsInstalled, busy, runInstall } = usePwaInstall();

  return (
    <header className="flex flex-col items-center gap-1.5 px-4 pt-4 pb-1 text-center sm:gap-2.5 sm:pt-7 sm:pb-3">
      {logoUrl ? (
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#E5E2DA] bg-white shadow-sm sm:h-16 sm:w-16">
          <Image
            src={logoUrl}
            alt={appName}
            fill
            className="object-cover object-center scale-[1.28]"
            sizes="(max-width:640px) 56px, 64px"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E2DA] bg-white text-xl shadow-sm sm:h-16 sm:w-16 sm:text-2xl"
          aria-hidden
        >
          📚
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <h1
          className="text-xl font-semibold tracking-tight sm:text-3xl"
          style={{ color: primaryColor }}
        >
          {homeTitle.trim() || DEFAULT_SITE_HOME_TITLE}
        </h1>
        {!hideAsInstalled ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runInstall()}
            className="shrink-0 rounded-lg border border-[#E5E2DA] bg-white p-1.5 text-[#2F3437] shadow-sm transition hover:bg-[#F7F6F3] disabled:cursor-wait disabled:opacity-60"
            aria-label="تحميل أو تثبيت التطبيق"
            title="تحميل أو تثبيت التطبيق"
          >
            <svg
              width="18"
              height="18"
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
          </button>
        ) : null}
      </div>
    </header>
  );
}
