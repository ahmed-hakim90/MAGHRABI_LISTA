"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  basePath: string;
  showPriceLists: boolean;
  showReels: boolean;
};

export function WholesaleHeader({
  basePath,
  showPriceLists,
  showReels,
}: Props) {

  const links: { href: string; label: string; active?: boolean }[] = [
    { href: basePath, label: "الكتالوج", active: true },
    ...(showPriceLists
      ? [{ href: `${basePath}/price-lists`, label: "قوائم تفاعلية" }]
      : []),
    ...(showReels ? [{ href: `${basePath}/reels`, label: "فيديوهات" }] : []),
  ];

  return (
    <header
      className="wholesale-header sticky top-0 z-40 border-b border-border bg-white pt-[env(safe-area-inset-top,0px)]"
      dir="rtl"
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[1320px] items-center gap-2 px-4 sm:px-6 lg:h-[76px] lg:gap-4 lg:px-10">
        <Link
          href={basePath}
          className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          aria-label="EL MAGHRABY — كتالوج الجملة"
        >
          <Image
            src="/brand/elmaghraby-logo.png"
            alt="EL MAGHRABY المغربي"
            width={360}
            height={265}
            priority
            className="h-9 w-auto sm:h-10 lg:h-12"
            sizes="96px"
          />
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-4 sm:gap-8"
          aria-label="أقسام الكتالوج"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={`relative whitespace-nowrap py-1 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red sm:text-sm ${
                link.active
                  ? "text-brand-red after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-brand-red"
                  : "text-foreground/75 hover:text-brand-red"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
