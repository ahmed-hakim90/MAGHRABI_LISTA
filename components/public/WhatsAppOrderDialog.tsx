"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useActiveFileCardsWhen } from "@/hooks/useFileCards";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import { publicCatalogFileViewPath } from "@/lib/constants/catalogChannels";
import { PUBLIC_WHATSAPP_ORDER_PREFILL } from "@/lib/constants/publicWhatsApp";
import type { FileCard } from "@/lib/types/models";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

type Props = {
  open: boolean;
  onClose: () => void;
};

function cardMatchesQuery(q: string, card: FileCard) {
  if (matchesFileCardSearch(card, q)) {
    return true;
  }
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return card.fileName.toLowerCase().includes(n);
}

export function WhatsAppOrderDialog({ open, onClose }: Props) {
  const { audience } = useCatalogChannel();
  const panelRef = useRef<HTMLDivElement>(null);
  const site = usePublicSiteSettings();
  const whatsappContacts = site.whatsappContacts;
  const [message, setMessage] = useState(PUBLIC_WHATSAPP_ORDER_PREFILL);
  const [selectedId, setSelectedId] = useState("");
  const [selectedWhatsappId, setSelectedWhatsappId] = useState("");
  const [fileQuery, setFileQuery] = useState("");
  const wasOpenRef = useRef(false);

  const { cards, loading, error } = useActiveFileCardsWhen(open, audience);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    const isNewOpen = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (isNewOpen) {
      setMessage(PUBLIC_WHATSAPP_ORDER_PREFILL);
      setSelectedId("");
      setFileQuery("");
      setSelectedWhatsappId("");
    }
    setSelectedWhatsappId((cur) => {
      if (whatsappContacts.length === 0) return "";
      if (cur && whatsappContacts.some((c) => c.id === cur)) return cur;
      return "";
    });
  }, [open, whatsappContacts]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    });
  }, [open]);

  const sorted = useMemo(
    () =>
      [...cards].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "ar", { sensitivity: "base" }),
      ),
    [cards],
  );

  const filtered = useMemo(
    () => sorted.filter((c) => cardMatchesQuery(fileQuery, c)),
    [sorted, fileQuery],
  );

  const selected = selectedId ? cards.find((c) => c.id === selectedId) : undefined;

  const selectedWhatsapp = useMemo(() => {
    if (!selectedWhatsappId) return undefined;
    return whatsappContacts.find((c) => c.id === selectedWhatsappId);
  }, [whatsappContacts, selectedWhatsappId]);

  const finalMessage = useMemo(() => {
    const base = message.trimEnd();
    if (!selected) return base;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const viewPath = publicCatalogFileViewPath(audience, selected.id);
    const fileLine = `\n\n—\nالملف: «${selected.fileName}»\nالرابط: ${origin}${viewPath}`;
    return base ? `${base}${fileLine}` : fileLine.trimStart();
  }, [message, selected, audience]);

  const openWhatsApp = () => {
    if (!selectedWhatsapp?.phoneDigits) return;
    const text = finalMessage.trim() || "—";
    const url = `https://wa.me/${selectedWhatsapp.phoneDigits}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[#2F3437]/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={() => onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-order-title"
        className="flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#F7F6F3] shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E5E2DA] px-5 py-4">
          <h2 id="whatsapp-order-title" className="text-lg font-semibold text-[#2F3437]">
            رسالة واتساب
          </h2>
          <button
            type="button"
            onClick={() => onClose()}
            className="shrink-0 rounded-lg px-2 py-1 text-2xl leading-none text-[#6B6B6B] transition hover:bg-black/5 hover:text-[#2F3437]"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {whatsappContacts.length > 0 ? (
            <div className="space-y-1.5">
              <label
                htmlFor="whatsapp-dest"
                className="text-sm font-medium text-[#2F3437]"
              >
                جهة التواصل{" "}
                <span className="font-normal text-[#6B6B6B]">(مطلوب)</span>
              </label>
              <select
                id="whatsapp-dest"
                value={selectedWhatsappId}
                onChange={(e) => setSelectedWhatsappId(e.target.value)}
                data-autofocus={whatsappContacts.length > 0 ? true : undefined}
                className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2.5 text-sm text-[#2F3437] outline-none focus:border-[#2F3437]/40 focus:ring-2 focus:ring-[#2F3437]/20"
                aria-label="اختر جهة واتساب"
              >
                <option value="">— اختر الاسم —</option>
                {whatsappContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
              role="status"
            >
              لا توجد أرقام واتساب مُعدّة. يُرجى إضافة أرقام من لوحة التحكم → إعدادات
              الموقع.
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="whatsapp-msg" className="text-sm font-medium text-[#2F3437]">
              نص الرسالة
            </label>
            <textarea
              id="whatsapp-msg"
              {...(whatsappContacts.length === 0 ? { "data-autofocus": true } : {})}
              dir="rtl"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-y rounded-xl border border-[#E5E2DA] bg-white px-3 py-2.5 text-sm leading-relaxed text-[#2F3437] outline-none ring-[#2F3437]/20 placeholder:text-[#6B6B6B] focus:border-[#2F3437]/40 focus:ring-2"
              placeholder="اكتب رسالتك أو عدّل النص الافتراضي…"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-[#2F3437]">
              الملف المرتبط بالاستفسار{" "}
              <span className="font-normal text-[#6B6B6B]">(اختياري)</span>
            </span>
            <input
              type="search"
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
              placeholder="بحث في العناوين أو اسم الملف…"
              className="mb-2 w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#2F3437] outline-none focus:border-[#2F3437]/40 focus:ring-2 focus:ring-[#2F3437]/20"
              aria-label="تصفية قائمة الملفات"
            />
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loading || !!error}
              className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2.5 text-sm text-[#2F3437] outline-none focus:border-[#2F3437]/40 focus:ring-2 focus:ring-[#2F3437]/20 disabled:opacity-60"
              aria-label="اختر ملفًا من الكتالوج"
            >
              <option value="">— بدون تحديد —</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.fileName}
                </option>
              ))}
            </select>
            {loading ? (
              <p className="text-xs text-[#6B6B6B]" role="status">
                جاري تحميل قائمة الملفات…
              </p>
            ) : null}
            {error ? (
              <p className="text-xs text-red-800" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          {selected ? (
            <p className="rounded-xl border border-dashed border-[#E5E2DA] bg-white/80 px-3 py-2 text-xs leading-relaxed text-[#6B6B6B]">
              <span className="font-medium text-[#2F3437]">يُضاف تلقائيًا للرسالة:</span>
              <br />
              الملف: «{selected.fileName}»
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[#E5E2DA] px-5 py-4">
          <button
            type="button"
            onClick={() => openWhatsApp()}
            disabled={!selectedWhatsapp?.phoneDigits}
            className="w-full rounded-xl bg-[#25D366] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#20BD5A] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            متابعة إلى واتساب
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            className="w-full rounded-xl border border-[#E5E2DA] bg-white px-4 py-2.5 text-sm font-medium text-[#2F3437] transition hover:bg-white/90"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
