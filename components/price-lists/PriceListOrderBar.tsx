"use client";

import { useState } from "react";
import type { WhatsAppContact } from "@/lib/types/models";
import type { CartLine } from "@/lib/types/priceList";
import {
  buildPriceListOrderMessage,
  whatsAppUrl,
} from "@/lib/utils/priceListWhatsApp";

type Props = {
  listName: string;
  lines: CartLine[];
  selectedCount: number;
  contacts: WhatsAppContact[];
  includePrices: boolean;
  onToast: (msg: string, kind?: "success" | "error") => void;
};

export function PriceListOrderBar({
  listName,
  lines,
  selectedCount,
  contacts,
  includePrices,
  onToast,
}: Props) {
  const [contactId, setContactId] = useState("");
  const resolvedContactId =
    contactId && contacts.some((c) => c.id === contactId)
      ? contactId
      : (contacts[0]?.id ?? "");
  const contact =
    contacts.find((c) => c.id === resolvedContactId) ?? contacts[0];

  function sendWhatsApp() {
    if (lines.length === 0) {
      onToast("اختر صنفًا واحدًا على الأقل", "error");
      return;
    }
    if (!contact?.phoneDigits) {
      onToast("لا توجد أرقام واتساب في إعدادات الموقع", "error");
      return;
    }
    const message = buildPriceListOrderMessage(listName, lines, includePrices);
    window.open(whatsAppUrl(contact.phoneDigits, message), "_blank", "noopener,noreferrer");
  }

  if (contacts.length === 0) return null;

  return (
    <div className="price-list-no-print fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">
          {selectedCount > 0
            ? `${selectedCount} صنف محدّد`
            : "اختر الأصناف وأدخل الكمية بالكرتونة"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {contacts.length > 1 ? (
            <select
              value={resolvedContactId}
              onChange={(e) => setContactId(e.target.value)}
              className="max-w-[10rem] rounded-xl border border-border px-2 py-2 text-sm"
              aria-label="جهة واتساب"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={sendWhatsApp}
            disabled={selectedCount === 0}
            className="min-h-touch flex-1 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:flex-none"
          >
            إرسال طلب واتساب
          </button>
        </div>
      </div>
    </div>
  );
}
