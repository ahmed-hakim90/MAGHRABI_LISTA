import { PUBLIC_WHATSAPP_WA_ME_NUMBER } from "@/lib/constants/publicWhatsApp";
import type { WhatsAppContact } from "@/lib/types/models";

/** Shown when Firestore has no valid contacts; matches previous single-number behavior. */
export const WHATSAPP_CONTACT_FALLBACK_DISPLAY_NAME = "التواصل";

const LEGACY_FALLBACK_ID = "legacy-default";

export function stripPhoneToWaMeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Parses Firestore / JSON array; drops invalid rows. Does not apply fallback.
 */
export function parseWhatsappContactsRaw(raw: unknown): WhatsAppContact[] {
  if (!Array.isArray(raw)) return [];
  const out: WhatsAppContact[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = String(item.id ?? "").trim();
    const displayName = String(item.displayName ?? "").trim();
    const phoneDigits = stripPhoneToWaMeDigits(String(item.phoneDigits ?? ""));
    if (!id || !displayName || !phoneDigits) continue;
    out.push({ id, displayName, phoneDigits });
  }
  return out;
}

/**
 * Public/catalog consumption: never return an empty list (wa.me would break).
 */
export function withWhatsappContactsFallback(
  contacts: WhatsAppContact[],
): WhatsAppContact[] {
  if (contacts.length > 0) return contacts;
  return [
    {
      id: LEGACY_FALLBACK_ID,
      displayName: WHATSAPP_CONTACT_FALLBACK_DISPLAY_NAME,
      phoneDigits: PUBLIC_WHATSAPP_WA_ME_NUMBER,
    },
  ];
}

/** Parse raw Firestore/JSON then apply legacy fallback if empty. */
export function resolvedWhatsappContactsForSite(raw: unknown): WhatsAppContact[] {
  return withWhatsappContactsFallback(parseWhatsappContactsRaw(raw));
}

/**
 * Normalize rows for persistence (trim names, digits-only phone). Empty rows removed.
 */
export function normalizeWhatsappContactsForSave(
  rows: WhatsAppContact[],
): WhatsAppContact[] {
  const seen = new Set<string>();
  const out: WhatsAppContact[] = [];
  for (const r of rows) {
    const id = String(r.id ?? "").trim();
    const displayName = String(r.displayName ?? "").trim();
    const phoneDigits = stripPhoneToWaMeDigits(String(r.phoneDigits ?? ""));
    if (!id || !displayName || !phoneDigits) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, displayName, phoneDigits });
  }
  return out;
}
