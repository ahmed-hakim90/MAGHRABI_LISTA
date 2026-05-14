/** Values that disable catalog floating chat (UI + POST /api/chat). Case-insensitive. */
const DISABLED_VALUES = new Set(["false", "0", "off", "no", "disabled"]);

/**
 * Catalog chat is enabled when `NEXT_PUBLIC_CATALOG_CHAT_ENABLED` is unset, empty, or any value other than the disabled literals.
 */
export function isCatalogChatEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_CATALOG_CHAT_ENABLED;
  if (raw == null || raw.trim() === "") return true;
  return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}
