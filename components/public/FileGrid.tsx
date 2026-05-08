"use client";

import type { FileCard as FileCardType } from "@/lib/types/models";
import { CATALOG_GRID_CLASS } from "./catalogLayout";
import type { CatalogViewMode } from "./CatalogViewToggle";
import { FileCard } from "./FileCard";

type Props = { cards: FileCardType[]; view?: CatalogViewMode };

export function FileGrid({ cards, view = "grid" }: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-base text-muted">
        لا توجد ملفات مطابقة لبحثك.
      </p>
    );
  }
  if (view === "list") {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5 px-safe pb-safe-fab sm:gap-3 sm:px-4">
        {cards.map((card) => (
          <FileCard key={card.id} card={card} variant="list" />
        ))}
      </div>
    );
  }
  return (
    <div
      className={`${CATALOG_GRID_CLASS} px-safe pb-safe-fab sm:px-4`}
    >
      {cards.map((card) => (
        <FileCard key={card.id} card={card} variant="grid" />
      ))}
    </div>
  );
}
