import type { Timestamp } from "firebase/firestore";

export function formatDisplayDate(
  value: Timestamp | Date | null | undefined,
  locale?: Intl.LocalesArgument,
): string {
  if (!value) return "—";
  const d = "toDate" in value ? value.toDate() : value;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Strict DD/MM/YYYY for the wholesale catalog — no month names, no locale
 * text, no commas. Accepts a Firestore Timestamp, Date, ISO string, or epoch
 * millis; returns "" when missing or unparseable so callers can drop it via
 * filter(Boolean). Does not alter sorting; display only.
 */
export function formatNumericDate(
  value: Timestamp | Date | string | number | null | undefined,
): string {
  if (value == null || value === "") return "";
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "object" && "toDate" in value) {
    d = value.toDate();
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}
