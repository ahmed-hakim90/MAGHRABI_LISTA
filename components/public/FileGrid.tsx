"use client";

import type { FileCard as FileCardType } from "@/lib/types/models";
import { FileCard } from "./FileCard";

type Props = { cards: FileCardType[] };

export function FileGrid({ cards }: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-[15px] text-[#6B6B6B]">
        لا توجد ملفات مطابقة لبحثك.
      </p>
    );
  }
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <FileCard key={card.id} card={card} />
      ))}
    </div>
  );
}
