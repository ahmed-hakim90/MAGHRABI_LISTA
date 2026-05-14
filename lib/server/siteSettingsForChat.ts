import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { WhatsAppContact } from "@/lib/types/models";
import { parseWhatsappContactsRaw } from "@/lib/utils/siteWhatsappContacts";

const SETTINGS_COLLECTION = "file_settings";
const SITE_DOC_ID = "site";

/**
 * Public merchant contact rows from Firestore (same doc as admin Settings).
 * Injected into /api/chat so the model can answer «أرقام الدعم» / WhatsApp without reading the PDF.
 */
export async function buildSiteContactContextForChat(): Promise<string> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(SETTINGS_COLLECTION).doc(SITE_DOC_ID).get();
    if (!snap.exists) return "";
    const data = snap.data() as Record<string, unknown>;
    const appName = String(data.appName ?? "").trim();
    const contacts = parseWhatsappContactsRaw(data.whatsappContacts);
    if (contacts.length === 0 && !appName) return "";

    const lines: string[] = [
      "## Site contact info (from Firestore settings / trusted)",
    ];
    if (appName) lines.push(`- App / site name: ${appName}`);
    if (contacts.length > 0) {
      lines.push(
        "- Official WhatsApp contacts (same digits as wa.me; use for «دعم» / «مبيعات» / contact):",
      );
      for (const c of contacts) {
        lines.push(
          `  - ${c.displayName}: international digits (no spaces) = ${c.phoneDigits}; open chat = https://wa.me/${c.phoneDigits}`,
        );
      }
    }
    lines.push("");
    lines.push(
      "When the user asks for support numbers, WhatsApp, or sales contact: reply in Egyptian Arabic with the numeric phone clearly (the digit string), then you may add the single wa.me link once per line—do not dump duplicate URLs or omit the digits. Do not say this information is missing if it appears above.",
    );
    return lines.join("\n");
  } catch {
    return "";
  }
}

/** Structured contacts for rule-based chat replies (no LLM). */
export async function getSiteWhatsappContactsForChat(): Promise<WhatsAppContact[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(SETTINGS_COLLECTION).doc(SITE_DOC_ID).get();
    if (!snap.exists) return [];
    const data = snap.data() as Record<string, unknown>;
    return parseWhatsappContactsRaw(data.whatsappContacts);
  } catch {
    return [];
  }
}
