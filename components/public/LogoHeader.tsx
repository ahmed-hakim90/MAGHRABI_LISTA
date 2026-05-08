"use client";

import Image from "next/image";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import {
  DEFAULT_SITE_HOME_TITLE,
  DEFAULT_SITE_PRIMARY_COLOR,
} from "@/lib/constants/siteDefaults";

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
  primaryColor = DEFAULT_SITE_PRIMARY_COLOR,
}: Props) {
  const { hideAsInstalled, busy, runInstall } = usePwaInstall();

  return (
    <header className="flex flex-col items-center gap-1.5 px-safe pt-safe pb-1 text-center sm:gap-2.5 sm:px-4 sm:pt-7 sm:pb-3">
      {logoUrl ? (
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border bg-card shadow-sm sm:h-16 sm:w-16">
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
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-xl shadow-sm sm:h-16 sm:w-16 sm:text-2xl"
          aria-hidden
        >
          📚
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <h1
          className="text-pretty text-xl font-bold tracking-tight sm:text-3xl"
          style={{ color: primaryColor }}
        >
          {homeTitle.trim() || DEFAULT_SITE_HOME_TITLE}
        </h1>
        {!hideAsInstalled ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runInstall()}
            className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl border border-border bg-card p-2 text-foreground shadow-sm transition active:scale-[0.98] hover:bg-surface disabled:cursor-wait disabled:opacity-60"
            aria-label="تحميل أو تثبيت التطبيق"
            title="تحميل أو تثبيت التطبيق"
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
          </button>
        ) : null}
      </div>
      {homeSubtitle.trim() ? (
        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted sm:text-[15px]">
          {homeSubtitle.trim()}
        </p>
      ) : null}
    </header>
  );
}
