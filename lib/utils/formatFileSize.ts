/** Human-readable byte size for catalog list (locale-aware numerals). */
export function formatFileSize(bytes: number, locale = "ar"): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 بايت";

  const units = ["بايت", "ك.ب", "م.ب", "ج.ب"] as const;
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;

  const fraction = value >= 10 || i === 0 ? 0 : 1;
  const n = value.toLocaleString(locale, {
    maximumFractionDigits: fraction,
    minimumFractionDigits: 0,
  });

  return `${n} ${units[i]}`;
}
