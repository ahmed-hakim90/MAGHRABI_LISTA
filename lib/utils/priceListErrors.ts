/** User-facing Arabic message for price list save/load failures. */
export function formatPriceListError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  if (
    lower.includes("permission-denied") ||
    lower.includes("missing or insufficient permissions")
  ) {
    return "صلاحيات مرفوضة. تأكد من تسجيل دخول الأدمن.";
  }
  if (lower.includes("firebase admin") || lower.includes("غير مكتملة")) {
    return "إعدادات Firebase Admin غير مكتملة على الخادم (.env).";
  }
  if (lower.includes("غير مصر") || lower.includes("غير مسموح")) {
    return msg;
  }
  if (msg.trim()) return msg;
  return fallback;
}
