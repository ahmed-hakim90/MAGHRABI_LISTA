"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveFileCardsWhen } from "@/hooks/useFileCards";
import {
  PUBLIC_WHATSAPP_ORDER_PREFILL,
  PUBLIC_WHATSAPP_WA_ME_NUMBER,
} from "@/lib/constants/publicWhatsApp";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState(PUBLIC_WHATSAPP_ORDER_PREFILL);
  const [selectedId, setSelectedId] = useState("");
  const [fileQuery, setFileQuery] = useState("");

  const { cards, loading, error } = useActiveFileCardsWhen(open);

  useEffect(() => {
    if (!open) return;
    setMessage(PUBLIC_WHATSAPP_ORDER_PREFILL);
    setSelectedId("");
    setFileQuery("");
  }, [open]);

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

  const finalMessage = useMemo(() => {
    const base = message.trimEnd();
    if (!selected) return base;
    const fileLine = `\n\n—\nالملف: «${selected.fileName}»`;
    return base ? `${base}${fileLine}` : fileLine.trimStart();
  }, [message, selected]);

  const openWhatsApp = () => {
    const text = finalMessage.trim() || "—";
    const url = `https://wa.me/${PUBLIC_WHATSAPP_WA_ME_NUMBER}?text=${encodeURIComponent(text)}`;
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
        className="max-h-[min(90dvh,40rem)] w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#F7F6F3] shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E2DA] px-5 py-4">
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

        <div className="max-h-[min(70dvh,32rem)] space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <label htmlFor="whatsapp-msg" className="text-sm font-medium text-[#2F3437]">
              نص الرسالة
            </label>
            <textarea
              id="whatsapp-msg"
              data-autofocus
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

        <div className="flex flex-col gap-2 border-t border-[#E5E2DA] px-5 py-4">
          <button
            type="button"
            onClick={() => openWhatsApp()}
            className="w-full rounded-xl bg-[#25D366] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#20BD5A] active:scale-[0.99]"
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
