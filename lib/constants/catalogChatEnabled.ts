/** Values that disable catalog floating chat (UI + POST /api/chat). Case-insensitive. */
const DISABLED_VALUES = new Set(["false", "0", "off", "no", "disabled"]);

/**
 * Catalog chat is enabled only when `NEXT_PUBLIC_CATALOG_CHAT_ENABLED` is set to a truthy value
 * (e.g. `true`, `1`, `on`). Unset or disabled literals keep chat hidden.
 */
export function isCatalogChatEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_CATALOG_CHAT_ENABLED;
  if (raw == null || raw.trim() === "") return false;
  return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}
