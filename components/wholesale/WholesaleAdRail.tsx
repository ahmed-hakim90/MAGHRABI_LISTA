"use client";

import Image from "next/image";
import { useSiteSettings } from "@/components/public/PublicSiteSettingsProvider";
import { resolveSiteHotlineNumber } from "@/lib/utils/hotlineNumber";

const DEFAULT_AD_SLOGAN = "اختيارات لبيتك.. وليك";

/** Roll-up banner geometry from the brand manual: overlapping arches. */
function RollupWatermark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <path
        d="M20 220V120c0-44 36-80 80-80h40c44 0 80 36 80 80v100"
        stroke="white"
        strokeOpacity="0.09"
        strokeWidth="10"
      />
      <path
        d="M20 20v100c0 44 36 80 80 80h40c44 0 80-36 80-80V20"
        stroke="white"
        strokeOpacity="0.07"
        strokeWidth="10"
      />
      <rect
        x="96"
        y="96"
        width="48"
        height="48"
        rx="14"
        fill="white"
        fillOpacity="0.06"
      />
    </svg>
  );
}

function RollupField({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-lg"
      style={{
        background:
          "linear-gradient(178deg, #91050F 0%, #B3101B 42%, #ED1F26 100%)",
      }}
    >
      <RollupWatermark className="pointer-events-none absolute inset-0 h-full w-full" />
      {children}
    </div>
  );
}

/**
 * Rollup-style ad space for the wholesale catalog (brand manual §Roll-Ups):
 * official white lockup, campaign slogan, and hotline in a vertical banner.
 * Title/slogan are admin-editable via Site Settings.
 */
export function WholesaleAdRail() {
  const site = useSiteSettings();
  const hotline = resolveSiteHotlineNumber(site.hotlineNumber);
  const slogan = site.adSlogan.trim() || DEFAULT_AD_SLOGAN;
  const title = site.adTitle.trim();

  return (
    <aside aria-label="مساحة إعلانية" className="w-[240px] shrink-0">
      <div className="sticky top-[96px]">
        <div className="aspect-[9/20] max-h-[560px]">
          <RollupField>
            <div className="relative flex items-center justify-center px-4 pt-5">
              <Image
                src="/brand/elmaghraby-logo-white.png"
                alt="EL MAGHRABY المغربي"
                width={720}
                height={172}
                className="h-12 w-auto"
                sizes="200px"
              />
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
              {title ? (
                <p className="text-[12px] font-semibold tracking-wide text-brand-gold">
                  {title}
                </p>
              ) : null}
              <p className="text-[22px] font-bold leading-snug text-white">
                {slogan}
              </p>
            </div>
            <div className="relative">
              <div className="h-px w-full bg-brand-gold/50" aria-hidden />
              <div className="flex items-center justify-between gap-2 px-4 py-3.5">
                <span className="text-[11px] font-semibold leading-tight text-white/85">
                  المغربي
                  <span className="block text-[9px] tracking-[0.14em] text-white/60">
                    EL MAGHRABY
                  </span>
                </span>
                {hotline ? (
                  <a
                    href={`tel:${hotline}`}
                    dir="ltr"
                    className="rounded-md bg-white/10 px-3 py-1.5 text-lg font-bold text-white underline-offset-4 transition hover:bg-white/20 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ivory"
                  >
                    {hotline}
                  </a>
                ) : null}
              </div>
            </div>
          </RollupField>
        </div>
      </div>
    </aside>
  );
}

/** Compact horizontal roll-up strip for small screens (same ad content). */
export function WholesaleAdBanner() {
  const site = useSiteSettings();
  const hotline = resolveSiteHotlineNumber(site.hotlineNumber);
  const slogan = site.adSlogan.trim() || DEFAULT_AD_SLOGAN;
  const title = site.adTitle.trim();

  return (
    <aside aria-label="مساحة إعلانية" className="lg:hidden">
      <div className="h-[88px]">
        <RollupField>
          <div className="relative flex h-full items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/brand/elmaghraby-logo-white.png"
                alt="EL MAGHRABY المغربي"
                width={720}
                height={172}
                className="h-9 w-auto shrink-0"
                sizes="140px"
              />
              <div className="min-w-0 text-start">
                {title ? (
                  <p className="truncate text-[10px] font-semibold text-brand-gold">
                    {title}
                  </p>
                ) : null}
                <p className="truncate text-[15px] font-bold text-white">
                  {slogan}
                </p>
              </div>
            </div>
            {hotline ? (
              <a
                href={`tel:${hotline}`}
                dir="ltr"
                className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-base font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ivory"
              >
                {hotline}
              </a>
            ) : null}
          </div>
        </RollupField>
      </div>
    </aside>
  );
}
