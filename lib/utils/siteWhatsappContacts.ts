import type { WhatsAppContact } from "@/lib/types/models";

export function stripPhoneToWaMeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normalize Egyptian/local input to wa.me digits (no +).
 * Examples: 01028644184 → 201028644184; 2001028644184 → 201028644184.
 */
export function normalizePhoneToWaMeDigits(value: string): string {
  let digits = stripPhoneToWaMeDigits(value);
  if (!digits) return "";

  // 2001xxxxxxxxx (common typo: 20 + 0 + local) → 201xxxxxxxxx
  if (digits.startsWith("200") && digits.length === 13) {
    return `20${digits.slice(3)}`;
  }

  // Already international Egypt: 20 + 10 digits
  if (digits.startsWith("20") && digits.length === 12) {
    return digits;
  }

  // Local mobile: 01xxxxxxxxx
  if (digits.startsWith("0") && digits.length === 11) {
    return `20${digits.slice(1)}`;
  }

  // 10-digit mobile without leading 0: 1xxxxxxxxx
  if (digits.startsWith("1") && digits.length === 10) {
    return `20${digits}`;
  }

  return digits;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Parses Firestore / JSON array; drops invalid rows.
 */
export function parseWhatsappContactsRaw(raw: unknown): WhatsAppContact[] {
  if (!Array.isArray(raw)) return [];
  const out: WhatsAppContact[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = String(item.id ?? "").trim();
    const displayName = String(item.displayName ?? "").trim();
    const phoneDigits = normalizePhoneToWaMeDigits(String(item.phoneDigits ?? ""));
    if (!id || !displayName || !phoneDigits) continue;
    out.push({ id, displayName, phoneDigits });
  }
  return out;
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
    const phoneDigits = normalizePhoneToWaMeDigits(String(r.phoneDigits ?? ""));
    if (!id || !displayName || !phoneDigits) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, displayName, phoneDigits });
  }
  return out;
}
