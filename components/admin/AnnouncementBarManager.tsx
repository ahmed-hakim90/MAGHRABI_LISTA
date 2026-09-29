"use client";

import { useEffect, useState } from "react";
import {
  listAnnouncements,
  saveAnnouncements,
} from "@/lib/services/announcements";
import type { AnnouncementItem } from "@/lib/types/models";
import {
  getActiveAnnouncements,
  isSafeAnnouncementLink,
} from "@/lib/utils/announcements";

type Draft = {
  /** null = persisted item being edited; non-null = unsaved new row */
  key: string;
  item: AnnouncementItem;
  /** datetime-local inputs ("" = unset) */
  startInput: string;
  endInput: string;
};

const EMPTY_ITEM = (): AnnouncementItem => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `ann-${Date.now()}`,
  textAr: "",
  textEn: "",
  link: "",
  linkLabelAr: "",
  linkLabelEn: "",
  openInNewTab: false,
  isActive: true,
  sortOrder: 0,
  startAt: null,
  endAt: null,
  createdAt: null,
  updatedAt: null,
});

function toInputValue(ms: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromInputValue(v: string): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

function formatSchedule(a: AnnouncementItem): string {
  if (a.startAt == null && a.endAt == null) return "بدون موعد";
  const fmt = (ms: number) =>
    new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(ms);
  if (a.startAt != null && a.endAt != null)
    return `${fmt(a.startAt)} ← ${fmt(a.endAt)}`;
  if (a.startAt != null) return `من ${fmt(a.startAt)}`;
  return `حتى ${fmt(a.endAt as number)}`;
}

function statusOf(a: AnnouncementItem, nowMs: number): string {
  if (!a.isActive) return "متوقف";
  if (a.endAt != null && nowMs > a.endAt) return "منتهي";
  if (a.startAt != null && nowMs < a.startAt) return "مجدول";
  return "مفعّل";
}

function patchItem(
  draft: Draft,
  patch: Partial<AnnouncementItem>,
): Draft {
  return { ...draft, item: { ...draft.item, ...patch } };
}

const INPUT =
  "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm";
const LABEL = "block text-xs font-medium text-muted";

export function AnnouncementBarManager() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void listAnnouncements().then((items) => {
      setDrafts(
        [...items]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            key: item.id,
            item,
            startInput: toInputValue(item.startAt),
            endInput: toInputValue(item.endAt),
          })),
      );
    });
  }, []);

  function update(index: number, next: Draft) {
    setDrafts((prev) =>
      (prev ?? []).map((d, i) => (i === index ? next : d)),
    );
    setDirty(true);
    setMsg(null);
  }

  function setField(
    index: number,
    patch: Partial<AnnouncementItem>,
    schedule?: { startInput?: string; endInput?: string },
  ) {
    const current = drafts?.[index];
    if (!current) return;
    let next = patchItem(current, patch);
    if (schedule?.startInput !== undefined) {
      next = {
        ...next,
        startInput: schedule.startInput,
        item: { ...next.item, startAt: fromInputValue(schedule.startInput) },
      };
    }
    if (schedule?.endInput !== undefined) {
      next = {
        ...next,
        endInput: schedule.endInput,
        item: { ...next.item, endAt: fromInputValue(schedule.endInput) },
      };
    }
    update(index, next);
  }

  function addNew() {
    const item = { ...EMPTY_ITEM(), sortOrder: drafts?.length ?? 0 };
    const key = item.id;
    setDrafts((prev) => [
      ...(prev ?? []),
      { key, item, startInput: "", endInput: "" },
    ]);
    setOpenKey(key);
    setDirty(true);
    setMsg(null);
  }

  function remove(index: number) {
    setDrafts((prev) => (prev ?? []).filter((_, i) => i !== index));
    setDirty(true);
    setMsg(null);
  }

  function move(index: number, dir: -1 | 1) {
    setDrafts((prev) => {
      if (!prev) return prev;
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((d, i) => patchItem(d, { sortOrder: i }));
    });
    setDirty(true);
  }

  async function onSave() {
    if (!drafts) return;
    for (const d of drafts) {
      const a = d.item;
      if (!a.textAr.trim() && !a.textEn.trim()) {
        setMsg("كل إعلان يحتاج نصًا عربيًا أو إنجليزيًا على الأقل.");
        return;
      }
      if (a.link && !isSafeAnnouncementLink(a.link)) {
        setMsg("رابط غير صالح: استخدم رابطًا يبدأ بـ / أو http(s)://");
        return;
      }
      if (a.startAt != null && a.endAt != null && a.endAt <= a.startAt) {
        setMsg("وقت نهاية الإعلان يجب أن يكون بعد بدايته.");
        return;
      }
      if (!Number.isFinite(a.sortOrder)) {
        setMsg("ترتيب العرض يجب أن يكون رقمًا.");
        return;
      }
    }
    setBusy(true);
    setMsg(null);
    try {
      const saved = await saveAnnouncements(
        drafts.map((d, i) => ({ ...d.item, sortOrder: i })),
      );
      setDrafts(
        saved.map((item) => ({
          key: item.id,
          item,
          startInput: toInputValue(item.startAt),
          endInput: toInputValue(item.endAt),
        })),
      );
      setDirty(false);
      setMsg("تم حفظ الإعلانات.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  }

  if (!drafts) {
    return <p className="text-muted">جاري التحميل…</p>;
  }

  const previewCount = getActiveAnnouncements(
    drafts.map((d) => d.item),
    nowMs,
  ).length;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          الشريط الإعلاني
        </h2>
        <p className="mt-1 text-xs text-muted">
          إعلانات متحركة أعلى هيدر كتالوج الجملة. يظهر {previewCount} إعلانًا
          الآن بالترتيب أعلاه. احفظ التغييرات لتفعيلها في الموقع.
        </p>
      </div>

      {msg ? (
        <p className="text-sm text-muted" role="status">
          {msg}
        </p>
      ) : null}

      {drafts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
          لا توجد إعلانات بعد.
        </p>
      ) : null}

      <ul className="space-y-3">
        {drafts.map((d, index) => {
          const a = d.item;
          const open = openKey === d.key;
          const status = statusOf(a, nowMs);
          return (
            <li
              key={d.key}
              className="rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    aria-label="تحريك لأعلى"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded border border-border bg-card px-1.5 text-xs disabled:opacity-40"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="تحريك لأسفل"
                    disabled={index === drafts.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded border border-border bg-card px-1.5 text-xs disabled:opacity-40"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground" dir="rtl">
                    {a.textAr || a.textEn || "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {status} · {formatSchedule(a)}
                    {a.link ? " · مرتبط" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                  onClick={() =>
                    setField(index, { isActive: !a.isActive })
                  }
                >
                  {a.isActive ? "إيقاف" : "تفعيل"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                  onClick={() =>
                    setOpenKey(open ? null : d.key)
                  }
                  aria-expanded={open}
                >
                  {open ? "إغلاق" : "تعديل"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                >
                  حذف
                </button>
              </div>

              {open ? (
                <div className="mt-3 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={LABEL}>النص العربي</span>
                    <input
                      className={INPUT}
                      dir="rtl"
                      value={a.textAr}
                      onChange={(e) => setField(index, { textAr: e.target.value })}
                      placeholder="خصومات خاصة لتجار الجملة — تواصل معنا الآن"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={LABEL}>النص الإنجليزي (اختياري)</span>
                    <input
                      className={INPUT}
                      dir="ltr"
                      value={a.textEn}
                      onChange={(e) => setField(index, { textEn: e.target.value })}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={LABEL}>الرابط (اختياري)</span>
                    <input
                      className={INPUT}
                      dir="ltr"
                      value={a.link}
                      onChange={(e) => setField(index, { link: e.target.value })}
                      placeholder="/wholesale أو https://…"
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>نص الرابط (عربي)</span>
                    <input
                      className={INPUT}
                      dir="rtl"
                      value={a.linkLabelAr}
                      onChange={(e) =>
                        setField(index, { linkLabelAr: e.target.value })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>نص الرابط (إنجليزي)</span>
                    <input
                      className={INPUT}
                      dir="ltr"
                      value={a.linkLabelEn}
                      onChange={(e) =>
                        setField(index, { linkLabelEn: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={a.openInNewTab}
                      onChange={(e) =>
                        setField(index, { openInNewTab: e.target.checked })
                      }
                    />
                    فتح الرابط في تبويب جديد
                  </label>
                  <label className="block">
                    <span className={LABEL}>يبدأ (اختياري)</span>
                    <input
                      type="datetime-local"
                      className={INPUT}
                      dir="ltr"
                      value={d.startInput}
                      onChange={(e) =>
                        setField(index, {}, { startInput: e.target.value })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>ينتهي (اختياري)</span>
                    <input
                      type="datetime-local"
                      className={INPUT}
                      dir="ltr"
                      value={d.endInput}
                      onChange={(e) =>
                        setField(index, {}, { endInput: e.target.value })
                      }
                    />
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          onClick={addNew}
        >
          + إضافة إعلان
        </button>
        <button
          type="button"
          disabled={!dirty || busy}
          onClick={() => void onSave()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "جاري الحفظ…" : "حفظ الإعلانات"}
        </button>
        {dirty ? (
          <span className="text-xs text-muted">
            تغييرات غير محفوظة — لن يراها الزوار قبل الحفظ.
          </span>
        ) : null}
      </div>
    </section>
  );
}
