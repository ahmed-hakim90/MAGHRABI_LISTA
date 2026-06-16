"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ServiceCentersSheet } from "@/components/public/ServiceCentersSheet";
import { FAB_CLASS } from "@/lib/constants/fabStyles";
import { shouldHideFloatingCatalogButtons } from "@/lib/utils/catalogChrome";

export function FloatingServiceCentersButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (shouldHideFloatingCatalogButtons(pathname)) {
    return null;
  }

  return (
    <>
      <ServiceCentersSheet open={open} onClose={() => setOpen(false)} />
      <div className="fixed bottom-[calc(8.75rem+max(1.25rem,env(safe-area-inset-bottom)))] end-[max(1.25rem,env(safe-area-inset-right))] z-[100]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${FAB_CLASS} bg-primary`}
          aria-label="مراكز الصيانة والفروع"
          title="مراكز الصيانة والفروع — سوكاني"
        >
          <MapPinGlyph className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </>
  );
}

function MapPinGlyph({ className }: { className?: string }) {
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
