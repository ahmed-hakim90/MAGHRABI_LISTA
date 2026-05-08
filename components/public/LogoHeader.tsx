"use client";

import Image from "next/image";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
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
  primaryColor = "#2F3437",
}: Props) {
  return (
    <header className="flex flex-col items-center gap-3 px-4 pt-10 pb-6 text-center">
      {logoUrl ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#E5E2DA] bg-white shadow-sm">
          <Image
            src={logoUrl}
            alt={appName}
            fill
            className="object-cover object-center scale-[1.28]"
            sizes="64px"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E5E2DA] bg-white text-2xl shadow-sm"
          aria-hidden
        >
          📚
        </div>
      )}
      <div>
        {/* <p className="text-sm font-medium text-[#6B6B6B]">
          {appName.trim() || DEFAULT_SITE_APP_NAME}
        </p> */}
        <h1
          className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
          style={{ color: primaryColor }}
        >
          {homeTitle.trim() || DEFAULT_SITE_HOME_TITLE}
        </h1>
       
      </div>
    </header>
  );
}
