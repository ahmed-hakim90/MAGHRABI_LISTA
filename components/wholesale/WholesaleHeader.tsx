"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  basePath: string;
};

/**
 * Sticky brand bar for the wholesale PDF library. The official logo is the
 * sole, centered visual anchor — the catalog section nav lives in the footer,
 * so the header carries no links and leaves no empty navigation gap.
 */
export function WholesaleHeader({ basePath }: Props) {
  return (
    <header
      className="wholesale-header sticky top-0 z-40 border-b border-border bg-white pt-[env(safe-area-inset-top,0px)]"
      dir="rtl"
    >
      <div className="mx-auto flex h-[60px] w-full max-w-[1320px] items-center justify-center px-4 sm:px-6 lg:h-[76px] lg:px-10">
        <Link
          href={basePath}
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
          aria-label="EL MAGHRABY — كتالوج الجملة"
        >
          <Image
            src="/brand/elmaghraby-logo.png"
            alt="EL MAGHRABY المغربي"
            width={360}
            height={265}
            priority
            className="h-10 w-auto sm:h-11 lg:h-14"
            sizes="120px"
          />
        </Link>
      </div>
    </header>
  );
}
