"use client";

import Image from "next/image";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import {
  DEFAULT_SITE_HOME_SUBTITLE,
  DEFAULT_SITE_HOME_TITLE,
} from "@/lib/constants/siteDefaults";

type Props = {
  appName: string;
  logoUrl?: string;
  homeTitle: string;
  homeSubtitle: string;
  primaryColor?: string;
};

export function PortalHero({
  appName,
  logoUrl,
  homeTitle,
  homeSubtitle,
  primaryColor = "#1D4ED8",
}: Props) {
  const { hideAsInstalled, busy, runInstall } = usePwaInstall();
  const title = homeTitle.trim() || DEFAULT_SITE_HOME_TITLE;
  const subtitle = homeSubtitle.trim() || DEFAULT_SITE_HOME_SUBTITLE;

  return (
    <section className="relative overflow-hidden px-safe pt-safe pb-4 sm:pb-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgb(29_78_216/0.12),transparent_55%),linear-gradient(180deg,rgb(255_255_255/0.9)_0%,var(--notion-bg)_100%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        {logoUrl ? (
          <div className="relative h-14 w-14 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] sm:h-20 sm:w-20">
            <Image
              src={logoUrl}
              alt={appName}
              fill
              className="object-cover object-center scale-[1.22]"
              sizes="(max-width:640px) 56px, 80px"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-3xl border border-border bg-card text-2xl shadow-[var(--shadow-card)] sm:h-20 sm:w-20 sm:text-4xl"
            aria-hidden
          >
            📚
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:mt-5">
          <h1
            className="text-pretty text-xl font-bold leading-tight tracking-tight sm:text-4xl sm:leading-tight"
            style={{ color: primaryColor }}
          >
            {title}
          </h1>
          {!hideAsInstalled ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runInstall()}
              className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-2xl border border-border bg-card/90 p-2 text-foreground shadow-[var(--shadow-card)] backdrop-blur-sm transition hover:bg-card active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
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
        <p className="mt-2 max-w-xl text-pretty text-xs leading-relaxed text-muted sm:mt-4 sm:text-base">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
