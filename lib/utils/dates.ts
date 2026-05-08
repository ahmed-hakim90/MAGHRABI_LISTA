import type { Timestamp } from "firebase/firestore";

export function formatDisplayDate(
  value: Timestamp | Date | null | undefined,
): string {
  if (!value) return "—";
  const d = "toDate" in value ? value.toDate() : value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
