"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ServiceCenterCard } from "@/components/public/ServiceCenterCard";
import {
  maintenanceCenters,
  salesCenters,
  SOKANY_MAINTENANCE_HOURS,
} from "@/lib/constants/sokanyServiceCenters";

type Props = {
  open: boolean;
  onClose: () => void;
};

function matchesQuery(q: string, name: string, address: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const hay = `${name} ${address}`.toLowerCase();
  return hay.includes(n);
}

export function ServiceCentersSheet({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      window.queueMicrotask(() => setQuery(""));
      return;
    }
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

  const maintenance = useMemo(
    () =>
      maintenanceCenters().filter((c) =>
        matchesQuery(query, c.name, c.address),
      ),
    [query],
  );

  const sales = useMemo(
    () =>
      salesCenters().filter((c) => matchesQuery(query, c.name, c.address)),
    [query],
  );

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
        aria-labelledby="service-centers-title"
        className="flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#F7F6F3] shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E5E2DA] px-5 py-4">
          <div>
            <h2
              id="service-centers-title"
              className="text-lg font-semibold text-[#2F3437]"
            >
              مراكز الصيانة والفروع
            </h2>
            <p className="mt-0.5 text-xs text-[#6B6B6B]">
              مواعيد الصيانة: {SOKANY_MAINTENANCE_HOURS} ما عدا الجمعة
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="shrink-0 rounded-lg px-2 py-1 text-2xl leading-none text-[#6B6B6B] transition hover:bg-black/5 hover:text-[#2F3437]"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="shrink-0 border-b border-[#E5E2DA] px-5 py-3">
          <input
            type="search"
            data-autofocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالاسم أو المحافظة…"
            className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2.5 text-sm text-[#2F3437] outline-none focus:border-[#2F3437]/40 focus:ring-2 focus:ring-[#2F3437]/20"
            aria-label="بحث في مراكز الخدمة"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {maintenance.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[#2F3437]">
                مراكز الصيانة المعتمدة
              </h3>
              <div className="space-y-3">
                {maintenance.map((center) => (
                  <ServiceCenterCard key={center.id} center={center} />
                ))}
              </div>
            </section>
          ) : null}

          {/* {sales.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-[#2F3437]">
                فروع البيع والاستلام
              </h3>
              <div className="space-y-3">
                {sales.map((center) => (
                  <ServiceCenterCard key={center.id} center={center} />
                ))}
              </div>
            </section>
          ) : null} */}

          {maintenance.length === 0 && sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B6B6B]" role="status">
              لا توجد نتائج مطابقة للبحث.
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[#E5E2DA] px-5 py-4">
          <button
            type="button"
            onClick={() => onClose()}
            className="w-full rounded-xl border border-[#E5E2DA] bg-white px-4 py-2.5 text-sm font-medium text-[#2F3437] transition hover:bg-white/90"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
