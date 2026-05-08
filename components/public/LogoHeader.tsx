"use client";

import Image from "next/image";

type Props = {
  appName: string;
  logoUrl?: string;
  homeTitle: string;
  homeSubtitle: string;
};

export function LogoHeader({
  appName,
  logoUrl,
  homeTitle,
  homeSubtitle,
}: Props) {
  return (
    <header className="flex flex-col items-center gap-3 px-4 pt-10 pb-6 text-center">
      {logoUrl ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
          <Image
            src={logoUrl}
            alt={appName}
            fill
            className="object-contain p-1"
            sizes="64px"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E5E2DA] bg-white text-2xl shadow-sm"
          aria-hidden
        >
          📚
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-[#6B6B6B]">{appName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2F3437] sm:text-3xl">
          {homeTitle || "File library"}
        </h1>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#6B6B6B]">
          {homeSubtitle || "Browse public documents."}
        </p>
      </div>
    </header>
  );
}
