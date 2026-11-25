import Image from "next/image";
import { CatalogListKebab } from "@/components/public/CatalogFileListHeader";
import type { CatalogViewMode } from "@/components/public/CatalogViewToggle";
import {
  SARAYA_FLIP_COVER,
  SARAYA_FLIP_HREF,
  SARAYA_FLIP_TITLE,
} from "@/lib/catalog/sarayaFlipCatalog";

const badgeBook =
  "rounded px-1.5 py-0.5 text-[10px] font-bold leading-4 shadow-sm bg-brand-burgundy text-white";

const gridShell =
  "group/card flex min-w-0 touch-manipulation flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm transition duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:border-brand-red/45 [@media(hover:hover)]:hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2";

/**
 * Opens the Saraya flip file as a full document so pages, hotspots, and
 * controls stay exactly as in the source HTML.
 */
export function SarayaFlipCard({
  variant = "grid",
  imagePriority = false,
}: {
  variant?: CatalogViewMode;
  imagePriority?: boolean;
}) {
  if (variant === "list") {
    return (
      <article
        className="relative flex min-h-[68px] items-center gap-3 border-b border-border bg-white px-3 transition-colors last:border-b-0 first:rounded-t-[7px] last:rounded-b-[7px] [@media(hover:hover)]:hover:bg-brand-ivory/40 sm:gap-4 sm:px-4"
        dir="rtl"
      >
        <a
          href={SARAYA_FLIP_HREF}
          className="absolute inset-y-0 start-0 end-0 z-0 rounded-none"
          aria-label={`عرض ${SARAYA_FLIP_TITLE}`}
        />
        <div
          className="relative z-[1] flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-white"
          aria-hidden
        >
          <Image
            src={SARAYA_FLIP_COVER}
            alt=""
            fill
            className="object-contain"
            sizes="36px"
            priority={imagePriority}
          />
        </div>
        <div className="pointer-events-none relative z-[1] min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-foreground sm:text-base">
            {SARAYA_FLIP_TITLE}
          </h2>
          <p className="mt-0.5 truncate text-xs font-bold text-muted sm:text-sm">
            كتالوج تفاعلي
          </p>
        </div>
        <span className="pointer-events-none relative z-[1] shrink-0">
          <span className={badgeBook}>كتاب</span>
        </span>
        <div className="relative z-[2] flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="pointer-events-none inline-flex items-center gap-1 text-[13px] font-semibold text-brand-red">
            <span className="hidden sm:inline">عرض القائمة</span>
            <span className="sm:hidden">عرض</span>
          </span>
          <CatalogListKebab
            href={SARAYA_FLIP_HREF}
            title={SARAYA_FLIP_TITLE}
            viewLabel="عرض القائمة"
            nativeNavigation
          />
        </div>
      </article>
    );
  }

  return (
    <a href={SARAYA_FLIP_HREF} className={gridShell} aria-label={`عرض ${SARAYA_FLIP_TITLE}`}>
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-white">
        <Image
          src={SARAYA_FLIP_COVER}
          alt=""
          fill
          className="object-contain transition duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover/card:scale-[1.015]"
          sizes="(max-width: 767px) 46vw, (max-width: 1279px) 31vw, 23vw"
          priority={imagePriority}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-border px-3 pb-1.5 pt-1.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 min-w-0 break-words text-sm font-bold leading-snug text-foreground sm:text-base">
            {SARAYA_FLIP_TITLE}
          </h2>
          <span className={`${badgeBook} shrink-0`}>كتاب</span>
        </div>
        <p className="line-clamp-1 text-xs font-bold text-muted sm:text-sm">
          كتالوج تفاعلي
        </p>
        <div className="mt-auto pt-1">
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-red">
            عرض القائمة
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="rtl:rotate-180"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}
