"use client";

import Image from "next/image";
import Link from "next/link";
import type { FileCard as FileCardType } from "@/lib/types/models";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatFileSize } from "@/lib/utils/formatFileSize";
import { getFileCardFreshnessBadge } from "@/lib/utils/fileCardBadges";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useNarrowViewportForNewTab } from "@/hooks/useNarrowViewportForNewTab";
import {
  CatalogListKebab,
  catalogListRowClass,
} from "./CatalogFileListHeader";
import type { CatalogViewMode } from "./CatalogViewToggle";
import { PdfFirstPagePreview } from "./PdfFirstPagePreview";

type Props = {
  card: FileCardType;
  variant?: CatalogViewMode;
  /** When true, thumbnail loads with high priority (first visible grid cells). */
  imagePriority?: boolean;
};

function hasThumbnail(card: FileCardType): boolean {
  return Boolean(card.thumbnailUrl?.trim());
}

function pingCatalogView(cardId: string) {
  void fetch("/api/catalog/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  }).catch(() => {});
}

const gridShell =
  "group/card flex min-w-0 touch-manipulation flex-col overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm transition duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:border-border [@media(hover:hover)]:hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const badgeNew =
  "rounded-full bg-accent px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#0f172a] shadow-sm sm:text-[10px]";
const badgeUpdated =
  "rounded-full bg-primary/90 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:text-[10px]";
const badgePdf =
  "rounded-md bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm sm:text-[10px]";

export function FileCard({
  card,
  variant = "grid",
  imagePriority = false,
}: Props) {
  const { basePath } = useCatalogChannel();
  const openFileInNewTab = useNarrowViewportForNewTab();
  const newTabAttrs = openFileInNewTab
    ? ({ target: "_blank" as const, rel: "noopener noreferrer" })
    : {};
  const isList = variant === "list";
  const viewHref = `${basePath}/file/${card.id}/view`;
  const pdfHref = `${basePath}/file/${card.id}/pdf`;
  /** On narrow / touch layouts: open the PDF stream in a new tab (native viewer, no site chrome). */
  const primaryOpenHref = openFileInNewTab ? pdfHref : viewHref;
  const freshness = getFileCardFreshnessBadge(card);

  const freshnessEl =
    freshness === "new" ? (
      <span className={badgeNew}>جديد</span>
    ) : freshness === "updated" ? (
      <span className={badgeUpdated}>محدّث</span>
    ) : null;

  if (isList) {
    const updated =
      card.updatedAt != null ? (
        <time
          dateTime={card.updatedAt.toDate().toISOString()}
          className="text-[13px] text-foreground/90 sm:text-sm"
        >
          {formatDisplayDate(card.updatedAt)}
        </time>
      ) : (
        <span className="text-[13px] text-muted sm:text-sm">—</span>
      );

    return (
      <article className={`${catalogListRowClass} min-w-0`} dir="rtl">
        {openFileInNewTab ? (
          <a
            href={primaryOpenHref}
            className="absolute inset-y-0 start-0 z-0 end-10 rounded-none"
            aria-label={`عرض ${card.title}`}
            onClick={() => pingCatalogView(card.id)}
            {...newTabAttrs}
          />
        ) : (
          <Link
            href={viewHref}
            className="absolute inset-y-0 start-0 z-0 end-10 rounded-none"
            aria-label={`عرض ${card.title}`}
          />
        )}
        <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-2 pointer-events-none sm:gap-3">
          <div
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border/60 bg-surface sm:h-10 sm:w-10"
            aria-hidden
          >
            {hasThumbnail(card) ? (
              <Image
                src={card.thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                priority={imagePriority}
              />
            ) : (
              <PdfFirstPagePreview cardId={card.id} pdfUrl={pdfHref} />
            )}
          </div>
          <div className="min-w-0 flex-1 ps-0.5">
            <h2 className="truncate text-[13px] font-semibold text-foreground sm:text-sm">
              {card.title}
            </h2>
            {freshnessEl ? (
              <div className="mt-0.5 flex pointer-events-none">{freshnessEl}</div>
            ) : null}
          </div>
          <div className="w-[6.5rem] shrink-0 text-end sm:w-32">{updated}</div>
          <div className="hidden w-16 shrink-0 text-end text-[13px] text-foreground/90 sm:block sm:w-20 sm:text-sm">
            {formatFileSize(card.fileSize)}
          </div>
        </div>
        <div className="relative z-[2] shrink-0 pointer-events-auto">
          <CatalogListKebab
            href={primaryOpenHref}
            title={card.title}
            downloadHref={`${pdfHref}?download`}
            openViewInNewTab
            onPrimaryClick={
              openFileInNewTab ? () => pingCatalogView(card.id) : undefined
            }
          />
        </div>
      </article>
    );
  }

  const gridBody = (
    <>
      <div className="relative isolate aspect-square w-full shrink-0 overflow-hidden bg-surface">
        <div className="relative z-0 h-full w-full min-h-0">
          {hasThumbnail(card) ? (
            <Image
              src={card.thumbnailUrl}
              alt=""
              fill
              className="object-contain transition duration-300 [@media(hover:hover)]:group-hover/card:scale-[1.02]"
              sizes="(max-width: 359px) 92vw, (max-width: 768px) 30vw, 20vw"
              unoptimized
              priority={imagePriority}
            />
          ) : (
            <PdfFirstPagePreview cardId={card.id} pdfUrl={pdfHref} />
          )}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-1 p-2"
          dir="rtl"
        >
          <span className={badgePdf}>PDF</span>
          <div className="flex flex-wrap justify-end gap-1">{freshnessEl}</div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 border-t border-border/70 px-2 py-2 sm:px-2.5 sm:py-2.5">
        <h2 className="line-clamp-2 text-center text-[11px] font-semibold leading-snug text-foreground sm:text-xs">
          {card.title}
        </h2>
        {(card.category?.trim() || card.updatedAt) && (
          <p className="line-clamp-1 text-center text-[10px] text-muted sm:text-[11px]">
            {card.category?.trim() ? (
              <span>{card.category.trim()}</span>
            ) : null}
            {card.category?.trim() && card.updatedAt ? (
              <span className="text-border" aria-hidden>
                {" "}
                ·{" "}
              </span>
            ) : null}
            {card.updatedAt ? (
              <time dateTime={card.updatedAt.toDate().toISOString()}>
                {formatDisplayDate(card.updatedAt)}
              </time>
            ) : null}
          </p>
        )}
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

  return <Link href={viewHref} className={gridShell}>{gridBody}</Link>;
}
