"use client";

import Image from "next/image";
import Link from "next/link";
import type { FileCard } from "@/lib/types/models";
import { publicCatalogFilePdfPath } from "@/lib/constants/catalogChannels";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useNarrowViewportForNewTab } from "@/hooks/useNarrowViewportForNewTab";
import { pingCatalogView, withDownloadParam } from "@/lib/utils/catalogActions";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatFileSize } from "@/lib/utils/formatFileSize";
import { getFileCardFreshnessBadge } from "@/lib/utils/fileCardBadges";
import { CatalogListKebab } from "@/components/public/CatalogFileListHeader";
import type { CatalogViewMode } from "@/components/public/CatalogViewToggle";

type Props = {
  card: FileCard;
  variant?: CatalogViewMode;
  imagePriority?: boolean;
};

function hasThumbnail(card: FileCard): boolean {
  return Boolean(card.thumbnailUrl?.trim());
}

/** Branded cover for PDF lists without a thumbnail — official emblem on Primary Red. */
export function WholesalePdfPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[#ed1f26] ${className}`}
      role="img"
      aria-label="غلاف المغربي الرسمي"
    >
      <Image
        src="/brand/elmaghraby-emblem.png"
        alt=""
        width={291}
        height={267}
        className="h-full w-full object-contain"
        sizes="(max-width: 767px) 46vw, (max-width: 1279px) 31vw, 23vw"
      />
    </div>
  );
}

const badgeBase =
  "rounded px-1.5 py-0.5 text-[10px] font-bold leading-4 shadow-sm";
const badgePdf = `${badgeBase} bg-brand-burgundy text-white`;
const badgeNew = `${badgeBase} bg-brand-red text-white`;
const badgeUpdated = `${badgeBase} bg-brand-gold text-[#4a3a06]`;

function PdfCardBadges({ card }: { card: FileCard }) {
  const freshness = getFileCardFreshnessBadge(card);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-1 p-2">
      <span className={badgePdf}>PDF</span>
      {freshness === "new" ? (
        <span className={badgeNew}>جديد</span>
      ) : freshness === "updated" ? (
        <span className={badgeUpdated}>محدّث</span>
      ) : (
        <span />
      )}
    </div>
  );
}

function CardActionLabel({ withIcon = true }: { withIcon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-red">
      عرض القائمة
      {withIcon ? (
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
      ) : null}
    </span>
  );
}

export function WholesalePdfCard({
  card,
  variant = "grid",
  imagePriority = false,
}: Props) {
  const { basePath } = useCatalogChannel();
  const openFileInNewTab = useNarrowViewportForNewTab();
  const newTabAttrs = openFileInNewTab
    ? ({ target: "_blank" as const, rel: "noopener noreferrer" })
    : {};
  const viewHref = `${basePath}/file/${card.id}/view`;
  const pdfHref = publicCatalogFilePdfPath(card.audience, card.id, card.version);
  /** Same behavior as the existing card: phones/touch open the raw PDF in a new tab. */
  const primaryOpenHref = openFileInNewTab ? pdfHref : viewHref;

  const category = card.category?.trim();
  const metaLine = [
    category,
    card.updatedAt ? formatDisplayDate(card.updatedAt) : null,
    card.fileSize ? formatFileSize(card.fileSize) : null,
  ].filter(Boolean);

  if (variant === "list") {
    return (
      <article
        className="relative flex min-h-[64px] items-center gap-3 border-b border-border bg-white px-3 transition-colors last:border-b-0 [@media(hover:hover)]:hover:bg-brand-ivory/40 sm:gap-4 sm:px-4"
        dir="rtl"
      >
        {openFileInNewTab ? (
          <a
            href={primaryOpenHref}
            className="absolute inset-y-0 start-0 end-0 z-0 rounded-none"
            aria-label={`عرض ${card.title}`}
            onClick={() => pingCatalogView(card.id)}
            {...newTabAttrs}
          />
        ) : (
          <Link
            href={primaryOpenHref}
            className="absolute inset-y-0 start-0 end-0 z-0 rounded-none"
            aria-label={`عرض ${card.title}`}
          />
        )}

        <div
          className="relative z-[1] flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-white"
          aria-hidden
        >
          {hasThumbnail(card) ? (
            <Image
              src={card.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
              priority={imagePriority}
            />
          ) : (
            <WholesalePdfPlaceholder />
          )}
        </div>

        <div className="relative z-[1] min-w-0 flex-1 pointer-events-none">
          <h2 className="truncate text-[13px] font-semibold text-foreground sm:text-sm">
            {card.title}
          </h2>
          {metaLine.length > 0 ? (
            <p className="mt-0.5 truncate text-[11px] text-muted sm:text-xs">
              {metaLine.join(" · ")}
            </p>
          ) : null}
        </div>

        <span className="relative z-[1] hidden shrink-0 sm:block pointer-events-none">
          <span className={badgePdf}>PDF</span>
        </span>

        <div className="relative z-[2] flex shrink-0 items-center gap-1">
          <span className="pointer-events-none sm:hidden">
            <CardActionLabel withIcon={false} />
          </span>
          <CatalogListKebab
            href={primaryOpenHref}
            title={card.title}
            viewLabel="عرض القائمة"
            downloadHref={withDownloadParam(pdfHref)}
            openViewInNewTab={openFileInNewTab}
            onPrimaryClick={
              openFileInNewTab ? () => pingCatalogView(card.id) : undefined
            }
          />
        </div>
      </article>
    );
  }

  const gridShell =
    "group/card flex min-w-0 touch-manipulation flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm transition duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:border-brand-red/45 [@media(hover:hover)]:hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2";

  const gridBody = (
    <>
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-white">
        {hasThumbnail(card) ? (
          <Image
            src={card.thumbnailUrl}
            alt=""
            fill
            className="object-contain transition duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover/card:scale-[1.015]"
            sizes="(max-width: 767px) 46vw, (max-width: 1279px) 31vw, 23vw"
            priority={imagePriority}
          />
        ) : (
          <WholesalePdfPlaceholder />
        )}
        <PdfCardBadges card={card} />
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-border px-3 py-2.5">
        <h2 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
          {card.title}
        </h2>
        {metaLine.length > 0 ? (
          <p className="line-clamp-1 text-[11px] text-muted">{metaLine.join(" · ")}</p>
        ) : null}
        <div className="mt-auto pt-1.5">
          <CardActionLabel />
        </div>
      </div>
    </>
  );

  if (openFileInNewTab) {
    return (
      <a
        href={primaryOpenHref}
        className={gridShell}
        onClick={() => pingCatalogView(card.id)}
        {...newTabAttrs}
      >
        {gridBody}
      </a>
    );
  }

  return (
    <Link href={primaryOpenHref} className={gridShell}>
      {gridBody}
    </Link>
  );
}
