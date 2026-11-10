"use client";

import { useState } from "react";
import { RAMADAN_2027_DEFAULTS } from "@/lib/constants/exhibition";
import type { NewExhibitionInput } from "@/lib/utils/exhibitionValidation";

const INPUT = "mt-1 w-full rounded-xl border border-border bg-card px-3 py-2";

export function CreateExhibitionForm({
  busy,
  suggestDefaults,
  onCreate,
  onCancel,
}: {
  busy: boolean;
  /** Prefill Ramadan 2027 for the very first exhibition. */
  suggestDefaults: boolean;
  onCreate: (input: NewExhibitionInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<NewExhibitionInput>(
    suggestDefaults
      ? { ...RAMADAN_2027_DEFAULTS }
      : {
          id: "",
          codePrefix: "",
          title: "",
          shortTitle: "",
          description: "",
          venueName: "",
          mapUrl: "",
        },
  );
  const set = (key: keyof NewExhibitionInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onCreate(form);
      }}
      className="space-y-4 rounded-2xl border border-border bg-card p-4"
    >
      <div>
        <h2 className="font-semibold text-foreground">معرض جديد</h2>
        <p className="mt-1 text-xs text-muted">
          يُنشأ المعرض مخفيًا بدون موعد. أظهِر الدعوة وانشر الموعد من بيانات المعرض
          بعد الإنشاء.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          المعرّف (إنجليزي، لا يتغير)
          <input
            required
            dir="ltr"
            className={`${INPUT} text-left`}
            value={form.id}
            onChange={set("id")}
            placeholder="ramadan-2028"
          />
        </label>
        <label className="block text-sm">
          بادئة رقم التسجيل
          <input
            required
            dir="ltr"
            maxLength={8}
            className={`${INPUT} text-left uppercase`}
            value={form.codePrefix}
            onChange={set("codePrefix")}
            placeholder="RM28"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          عنوان المعرض
          <input required className={INPUT} value={form.title} onChange={set("title")} />
        </label>
        <label className="block text-sm">
          الاسم المختصر
          <input
            required
            maxLength={40}
            className={INPUT}
            value={form.shortTitle}
            onChange={set("shortTitle")}
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
        <label className="block text-sm">
          المكان
          <input
            maxLength={160}
            className={INPUT}
            value={form.venueName}
            onChange={set("venueName")}
          />
        </label>
        <label className="block text-sm">
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
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "جاري الإنشاء…" : "إنشاء المعرض"}
        </button>
        {onCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            إلغاء
          </button>
        ) : null}
      </div>
    </form>
  );
}
