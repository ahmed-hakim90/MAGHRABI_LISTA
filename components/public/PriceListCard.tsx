"use client";

import Link from "next/link";
import type { PriceList } from "@/lib/types/priceList";
import { publicPriceListPath } from "@/lib/constants/catalogChannels";
import { CATALOG_GRID_CLASS } from "./catalogLayout";

type Props = {
  list: PriceList;
  variant?: "grid" | "list";
};

const gridShell =
  "group flex min-w-0 touch-manipulation flex-col overflow-hidden rounded-xl border border-[#ca8a04]/50 bg-gradient-to-b from-[#FEF9C3] to-white shadow-sm transition duration-200 [@media(hover:hover)]:hover:shadow-md active:scale-[0.99]";

const badgeInteractive =
  "rounded-md bg-[#ca8a04] px-1.5 py-0.5 text-[9px] font-bold text-white sm:text-[10px]";

export function PriceListCard({ list, variant = "grid" }: Props) {
  const href = publicPriceListPath(list.audience, list.slug);

  if (variant === "list") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl border border-[#ca8a04]/40 bg-[#FEF9C3]/40 px-4 py-3 transition hover:bg-[#FEF9C3]/70"
      >
        <span className={badgeInteractive}>جدول</span>
        <span className="min-w-0 flex-1 font-semibold text-foreground">
          {list.name}
        </span>
        <span className="text-sm text-primary">عرض ←</span>
      </Link>
    );
  }

  return (
    <Link href={href} className={gridShell}>
      {list.coverImage ? (
        <div className="relative flex h-36 items-center justify-center bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={list.coverImage}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center bg-[#FACC15]/30">
          <span className="text-3xl font-bold text-[#ca8a04]">₤</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#1a1a1a]">
            {list.name}
          </h3>
          <span className={badgeInteractive}>تفاعلية</span>
        </div>
        <p className="mt-auto text-xs text-muted">طلب بالكرتونة · واتساب</p>
      </div>
    </Link>
  );
}

type GridProps = {
  lists: PriceList[];
  variant?: "grid" | "list";
  showHeading?: boolean;
};

export function PriceListGrid({
  lists,
  variant = "grid",
  showHeading = true,
}: GridProps) {
  if (lists.length === 0) return null;

  if (variant === "list") {
    return (
      <section className="mb-6 space-y-3">
        {showHeading ? (
          <h2 className="px-1 text-sm font-semibold text-foreground">
            قوائم أسعار تفاعلية
          </h2>
        ) : null}
        <div className="space-y-2">
          {lists.map((list) => (
            <PriceListCard key={list.id} list={list} variant="list" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 space-y-3">
      {showHeading ? (
        <h2 className="px-1 text-sm font-semibold text-foreground">
          قوائم أسعار تفاعلية
        </h2>
      ) : null}
      <div className={CATALOG_GRID_CLASS}>
        {lists.map((list) => (
          <PriceListCard key={list.id} list={list} variant="grid" />
        ))}
      </div>
    </section>
  );
}
