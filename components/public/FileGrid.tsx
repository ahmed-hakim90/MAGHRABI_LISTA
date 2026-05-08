"use client";

import type { FileCard as FileCardType } from "@/lib/types/models";
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
      <div className="mx-auto flex max-w-3xl flex-col gap-2.5 px-safe pb-safe-fab sm:gap-3 sm:px-4">
        {cards.map((card) => (
          <FileCard key={card.id} card={card} variant="list" />
        ))}
      </div>
    );
  }
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2.5 px-safe pb-safe-fab sm:gap-4 sm:px-4">
      {cards.map((card) => (
        <FileCard key={card.id} card={card} variant="grid" />
      ))}
    </div>
  );
}
