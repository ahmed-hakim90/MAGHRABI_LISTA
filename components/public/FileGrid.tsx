"use client";

import type { FileCard as FileCardType } from "@/lib/types/models";
import {
  CatalogFileListHeader,
  catalogListContainerClass,
} from "./CatalogFileListHeader";
import {
  CATALOG_GRID_CLASS,
  CATALOG_GRID_PRIORITY_COUNT,
} from "./catalogLayout";
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
      <div className="mx-auto w-full max-w-6xl px-safe pb-safe-fab sm:px-4">
        <div className={catalogListContainerClass}>
          <CatalogFileListHeader kind="files" />
          <div role="list">
            {cards.map((card) => (
              <div key={card.id} role="listitem">
                <FileCard card={card} variant="list" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${CATALOG_GRID_CLASS} px-safe pb-safe-fab sm:px-4`}
    >
      {cards.map((card, index) => (
        <FileCard
          key={card.id}
          card={card}
          variant="grid"
          imagePriority={index < CATALOG_GRID_PRIORITY_COUNT}
        />
      ))}
    </div>
  );
}
