"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from "@/components/public/PublicSiteSettingsProvider";
import { resolveSiteHotlineNumber } from "@/lib/utils/hotlineNumber";

type Props = {
  basePath: string;
  showPriceLists: boolean;
  showReels: boolean;
};

/** Compact closing footer for the wholesale PDF library. */
export function WholesaleFooter({ basePath, showPriceLists, showReels }: Props) {
  const site = useSiteSettings();
  const hotline = resolveSiteHotlineNumber(site.hotlineNumber);
  const year = new Date().getFullYear();

  const links: { href: string; label: string }[] = [
    { href: basePath, label: "الكتالوج" },
    ...(showPriceLists
      ? [{ href: `${basePath}/price-lists`, label: "قوائم تفاعلية" }]
      : []),
    ...(showReels ? [{ href: `${basePath}/reels`, label: "فيديوهات" }] : []),
  ];

  return (
    <footer
      className="relative shrink-0 overflow-hidden bg-brand-burgundy text-white"
      role="contentinfo"
      dir="rtl"
    >
      <div
        aria-hidden
        className="wholesale-footer-pattern pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10 lg:py-14">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/elmaghraby-logo-white.png"
            alt="EL MAGHRABY المغربي"
            width={720}
            height={172}
            className="h-10 w-auto shrink-0 sm:h-12"
            sizes="220px"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">مغربي — EL MAGHRABY</p>
            <p className="text-xs text-white/70">
              مكتبة الكتالوجات وقوائم الجملة الرسمية
            </p>
          </div>
        </div>

        <nav aria-label="روابط الكتالوج" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ivory"
            >
              {link.label}
            </Link>
          ))}
          {hotline ? (
            <a
              href={`tel:${hotline}`}
              className="text-[13px] text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ivory"
            >
              الخط الساخن: <span dir="ltr">{hotline}</span>
            </a>
          ) : null}
        </nav>
      </div>
      <div className="relative border-t border-white/15">
        <p className="mx-auto w-full max-w-[1320px] px-4 py-3 text-center text-[11px] text-white/60 sm:px-6 lg:px-10">
          © {year} EL MAGHRABY — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
