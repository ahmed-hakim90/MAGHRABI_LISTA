"use client";

import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/components/public/PublicSiteSettingsProvider";
import { shouldHideFloatingCatalogButtons } from "@/lib/utils/catalogChrome";
import { resolveSiteHotlineNumber } from "@/lib/utils/hotlineNumber";

export function HotlineFloatingButton() {
  const pathname = usePathname();
  const site = useSiteSettings();
  const hotline = resolveSiteHotlineNumber(site.hotlineNumber);

  if (shouldHideFloatingCatalogButtons(pathname) || !hotline) {
    return null;
  }

  return (
    <a
      href={`tel:${hotline}`}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-[max(1.25rem,env(safe-area-inset-right))] z-[100] flex h-14 w-14 transform-gpu items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-1 ring-black/10 transition-transform duration-200 hover:scale-105 hover:shadow-xl active:scale-95 [backface-visibility:hidden]"
      aria-label={`اتصل بالخط الساخن ${hotline}`}
      title={`الخط الساخن — ${hotline}`}
    >
      <PhoneGlyph className="h-7 w-7" aria-hidden />
    </a>
  );
}

function PhoneGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
