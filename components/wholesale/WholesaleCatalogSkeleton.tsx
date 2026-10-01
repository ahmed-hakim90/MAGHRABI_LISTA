"use client";

import type { CatalogViewMode } from "@/components/public/CatalogViewToggle";

const pulse = "animate-pulse motion-reduce:animate-none";

/** Skeletons shaped like the final PDF cards to avoid layout shift. */
export function WholesaleCatalogSkeleton({
  view = "grid",
  count = 8,
}: {
  view?: CatalogViewMode;
  count?: number;
}) {
  if (view === "list") {
    return (
      <div
        className="rounded-lg border border-border bg-white"
        aria-label="تحميل القوائم"
        aria-busy="true"
      >
        {Array.from({ length: Math.min(count, 6) }, (_, i) => (
          <div
            key={i}
            className="flex min-h-[68px] items-center gap-3 border-b border-border px-3 last:border-b-0 first:rounded-t-[7px] last:rounded-b-[7px] sm:gap-4 sm:px-4"
          >
            <div
              className={`h-12 w-9 shrink-0 rounded bg-brand-ivory ${pulse}`}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className={`h-3.5 w-2/3 rounded bg-brand-ivory ${pulse}`} />
              <div
                className={`h-2.5 w-1/3 rounded bg-brand-ivory/70 ${pulse}`}
              />
            </div>
            <div
              className={`h-4 w-10 shrink-0 rounded bg-brand-ivory/70 ${pulse}`}
            />
            <div
              className={`hidden h-3.5 w-12 shrink-0 rounded bg-brand-ivory/60 sm:block ${pulse}`}
            />
            <div
              className={`h-9 w-9 shrink-0 rounded-lg bg-brand-ivory/60 ${pulse}`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-3 max-[359px]:grid-cols-1 md:grid-cols-3 md:gap-4 xl:grid-cols-4"
      aria-label="تحميل القوائم"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-white"
        >
          <div className={`aspect-[3/4] w-full bg-brand-ivory/80 ${pulse}`} />
          <div className="flex flex-col gap-1 border-t border-border px-3 pb-1.5 pt-1.5">
            <div className={`h-3.5 w-4/5 rounded bg-brand-ivory ${pulse}`} />
            <div
              className={`h-2.5 w-1/2 rounded bg-brand-ivory/70 ${pulse}`}
            />
            <div
              className={`mt-1 h-3 w-1/3 rounded bg-brand-ivory/60 ${pulse}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
