import type { FileCard } from "@/lib/types/models";

export function matchesFileCardSearch(card: FileCard, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const blob = [card.title, card.description, card.category, ...card.tags]
    .join(" ")
    .toLowerCase();
  return blob.includes(n);
}
