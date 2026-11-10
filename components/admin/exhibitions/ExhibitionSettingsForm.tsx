"use client";

import { useMemo, useState } from "react";
import { SCHEDULE_STATUS_LABELS_AR } from "@/lib/constants/exhibition";
import type { Exhibition, ExhibitionDetails } from "@/lib/types/exhibition";
import type { ExhibitionPatch } from "@/lib/utils/exhibitionValidation";

const INPUT = "mt-1 w-full rounded-xl border border-border bg-card px-3 py-2";

type FormState = Omit<ExhibitionDetails, "scheduleStatus">;

function toForm(ex: Exhibition): FormState {
  return {
    title: ex.title,
    shortTitle: ex.shortTitle,
    description: ex.description,
    date: ex.date,
    startTime: ex.startTime,
    endTime: ex.endTime,
    venueName: ex.venueName,
    mapUrl: ex.mapUrl,
  };
}

export function ExhibitionSettingsForm({
  exhibition,
  busy,
  onSave,
}: {
  exhibition: Exhibition;
  busy: boolean;
  /** On success the parent passes a new `exhibition`, which resets the form. */
  onSave: (patch: ExhibitionPatch, successMessage: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(exhibition));
  const [baseline, setBaseline] = useState(exhibition);
  if (baseline !== exhibition) {
    setBaseline(exhibition);
    setForm(toForm(exhibition));
  }

  const dirty = useMemo(() => {
    const saved = toForm(exhibition);
    return (Object.keys(saved) as (keyof FormState)[]).some(
      (k) => saved[k] !== form[k],
    );
  }, [exhibition, form]);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const announced = exhibition.scheduleStatus === "announced";

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form, announced ? "تم الحفظ وتحديث الدعوة المنشورة" : "تم حفظ التعديلات");
  }

  async function publishSchedule() {
    if (
      !confirm(
        "نشر الموعد يظهره لكل الزوار ويتيح إضافته للتقويم. هل البيانات صحيحة؟",
      )
    ) {
      return;
    }
    await onSave({ ...form, scheduleStatus: "announced" }, "تم نشر موعد المعرض");
  }

  async function unpublishSchedule() {
    if (!confirm("سيعود الموعد إلى «سيتم الإعلان عنه قريبًا» وتختفي أزرار التقويم. متابعة؟")) {
      return;
    }
    await onSave({ scheduleStatus: "pending" }, "تم إخفاء الموعد");
  }

  async function toggleActive() {
    const next = !exhibition.isActive;
    if (
      next &&
      !confirm("ستظهر دعوة هذا المعرض لكل زوار الموقع، ويتوقف أي معرض آخر نشط. متابعة؟")
    ) {
      return;
    }
    await onSave(
      { isActive: next },
      next ? "الدعوة ظاهرة الآن على الموقع" : "تم إخفاء الدعوة من الموقع",
    );
  }

  return (
    <form
      onSubmit={(e) => void saveDetails(e)}
      className="space-y-4 rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">بيانات المعرض والموعد</h2>
          <p className="mt-1 text-xs text-muted">
            التواريخ والأوقات بتوقيت القاهرة. الموعد لا يظهر للزوار قبل النشر.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              exhibition.isActive
                ? "bg-emerald-50 text-emerald-800"
                : "bg-surface text-muted"
            }`}
          >
            {exhibition.isActive ? "الدعوة ظاهرة على الموقع" : "الدعوة مخفية"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              announced ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            الموعد: {SCHEDULE_STATUS_LABELS_AR[exhibition.scheduleStatus]}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          عنوان المعرض
          <input required className={INPUT} value={form.title} onChange={set("title")} />
        </label>
        <label className="block text-sm">
          الاسم المختصر (يظهر على زر الدعوة)
          <input
            required
            maxLength={40}
            className={INPUT}
            value={form.shortTitle}
            onChange={set("shortTitle")}
          />
        </label>
        <label className="block text-sm">
          المكان
          <input
            maxLength={160}
            className={INPUT}
            value={form.venueName}
            onChange={set("venueName")}
            placeholder="المنطقة الصناعية الثالثة – A5 – قطعة 210 – العاشر من رمضان، الشرقية"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          نص الدعوة
          <textarea
            rows={3}
            maxLength={600}
            className={INPUT}
            value={form.description}
            onChange={set("description")}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          رابط Google Maps
          <input
            dir="ltr"
            type="url"
            className={`${INPUT} text-left`}
            value={form.mapUrl}
            onChange={set("mapUrl")}
            placeholder="https://maps.app.goo.gl/..."
          />
        </label>
        <label className="block text-sm">
          تاريخ المعرض
          <input type="date" className={INPUT} value={form.date} onChange={set("date")} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            من
            <input
              type="time"
              className={INPUT}
              value={form.startTime}
              onChange={set("startTime")}
            />
          </label>
          <label className="block text-sm">
            إلى
            <input
              type="time"
              className={INPUT}
              value={form.endTime}
              onChange={set("endTime")}
            />
          </label>
        </div>
      </div>

      {dirty ? (
        <p className="text-xs font-medium text-amber-800">توجد تغييرات غير محفوظة.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || !dirty}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "جاري الحفظ…" : "حفظ التعديلات"}
        </button>
        {announced ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void unpublishSchedule()}
            className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            إرجاع إلى «سيتم الإعلان قريبًا»
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void publishSchedule()}
            className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-800 disabled:opacity-50"
          >
            نشر الموعد
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleActive()}
          className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {exhibition.isActive ? "إخفاء الدعوة من الموقع" : "إظهار الدعوة على الموقع"}
        </button>
      </div>
    </form>
  );
}
