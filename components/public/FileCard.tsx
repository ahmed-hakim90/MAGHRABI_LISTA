"use client";

import Image from "next/image";
import Link from "next/link";
import type { FileCard as FileCardType } from "@/lib/types/models";
import { formatDisplayDate } from "@/lib/utils/dates";
import { getFileCardFreshnessBadge } from "@/lib/utils/fileCardBadges";
import type { CatalogViewMode } from "./CatalogViewToggle";

type Props = { card: FileCardType; variant?: CatalogViewMode };

const cardShell =
  "group/card flex touch-manipulation overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99]";

export function FileCard({ card, variant = "grid" }: Props) {
  const isList = variant === "list";
  const viewHref = `/file/${card.id}/view`;
  const freshness = getFileCardFreshnessBadge(card);

  const freshnessEl =
    freshness === "new" ? (
      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f172a] shadow-sm sm:text-[11px]">
        جديد
      </span>
    ) : freshness === "updated" ? (
      <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm sm:text-[11px]">
        محدّث
      </span>
    ) : null;

  const metaLine = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted sm:text-xs">
      {card.productCount != null ? (
        <span className="font-medium text-foreground/90">
          {card.productCount.toLocaleString("ar")} صنف
        </span>
      ) : null}
      {card.productCount != null ? (
        <span className="text-border" aria-hidden>
          ·
        </span>
      ) : null}
      {card.updatedAt ? (
        <time dateTime={card.updatedAt.toDate().toISOString()}>
          آخر تحديث {formatDisplayDate(card.updatedAt)}
        </time>
      ) : (
        <span>آخر تحديث {formatDisplayDate(card.updatedAt)}</span>
      )}
    </div>
  );

  if (isList) {
    return (
      <article className={`${cardShell} min-h-[5.5rem] flex-row items-stretch`}>
        <Link
          href={viewHref}
          className="relative aspect-square w-[5.5rem] shrink-0 bg-surface sm:w-28"
        >
          {card.thumbnailUrl ? (
            <Image
              src={card.thumbnailUrl}
              alt=""
              fill
              className="object-cover transition duration-300 [@media(hover:hover)]:group-hover/card:scale-[1.02]"
              sizes="(max-width:640px) 88px, 112px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-muted/35">
              📄
            </div>
          )}
          {freshnessEl ? (
            <div className="absolute end-2 top-2 flex flex-wrap justify-end gap-1">
              {freshnessEl}
            </div>
          ) : null}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-border sm:text-xs">
              {card.category?.trim() || "عام"}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary sm:text-xs">
              PDF
            </span>
          </div>
          <Link href={viewHref} className="min-w-0">
            <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">
              {card.title}
            </h2>
          </Link>
          {card.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">
              {card.description}
            </p>
          ) : null}
          {metaLine}
          <div className="pt-0.5">
            <Link
              href={viewHref}
              className="inline-flex min-h-touch items-center justify-center rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 sm:text-sm"
            >
              عرض
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`${cardShell} flex-col`}>
      <Link href={viewHref} className="relative block aspect-[4/3] w-full bg-surface">
        {card.thumbnailUrl ? (
          <Image
            src={card.thumbnailUrl}
            alt=""
            fill
            className="object-cover transition duration-300 [@media(hover:hover)]:group-hover/card:scale-[1.02]"
            sizes="23vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted/35 sm:text-5xl">
            📄
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-1.5 p-2.5 sm:p-3">
          <div className="flex flex-wrap gap-1">{freshnessEl}</div>
          <span className="rounded-full bg-primary/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-[2px] sm:text-xs">
            PDF
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <span className="w-fit rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-border sm:text-xs">
          {card.category?.trim() || "عام"}
        </span>
        <Link href={viewHref} className="min-w-0">
          <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-foreground sm:text-lg sm:leading-snug">
            {card.title}
          </h2>
        </Link>
        {card.description ? (
          <p className="hidden line-clamp-2 text-sm leading-relaxed text-muted sm:block">
            {card.description}
          </p>
        ) : null}
        {metaLine}
        <Link
          href={viewHref}
          className="mt-auto inline-flex min-h-touch w-full items-center justify-center rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 sm:py-3"
        >
          عرض
        </Link>
      </div>
    </article>
  );
}
