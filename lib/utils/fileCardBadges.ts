import type { FileCard } from "@/lib/types/models";

/** Single primary badge: NEW wins over UPDATED (time-based heuristics). */
export function getFileCardFreshnessBadge(
  card: FileCard,
  nowMs = Date.now(),
): "new" | "updated" | null {
  const created = card.createdAt?.toMillis?.() ?? null;
  const updated = card.updatedAt?.toMillis?.() ?? null;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if (created != null && nowMs - created < sevenDays) return "new";
  if (updated != null && nowMs - updated < threeDays) return "updated";
  return null;
}
