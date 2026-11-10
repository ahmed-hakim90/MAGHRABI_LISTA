"use client";

import { useState } from "react";
import { localMobile } from "@/components/admin/exhibitions/ExhibitionRegistrationsTable";
import {
  EXHIBITION_MESSAGE_MAX_LENGTH,
  MESSAGE_KIND_LABELS_AR,
} from "@/lib/constants/exhibition";
import type {
  Exhibition,
  ExhibitionMessageKind,
  ExhibitionRegistration,
} from "@/lib/types/exhibition";
import { whatsAppUrl } from "@/lib/utils/priceListWhatsApp";
import {
  describeExhibitionSchedule,
  exhibitionIcsPath,
  resolveExhibitionInstant,
} from "@/lib/utils/exhibitionSchedule";
import {
  DEFAULT_EXHIBITION_TEMPLATES,
  EXHIBITION_MESSAGE_PLACEHOLDERS,
  renderExhibitionMessage,
} from "@/lib/utils/exhibitionWhatsApp";

type LogState = "saving" | "saved" | "failed";

export function ExhibitionWhatsAppPanel({
  exhibition,
  recipients,
  onClearSelection,
  onLogOpened,
}: {
  exhibition: Exhibition;
  recipients: ExhibitionRegistration[];
  onClearSelection: () => void;
  /** Persists the "chat opened" log; rejects with a user-safe message. */
  onLogOpened: (
    row: ExhibitionRegistration,
    kind: ExhibitionMessageKind,
    message: string,
  ) => Promise<void>;
}) {
  const [kind, setKind] = useState<ExhibitionMessageKind>("invitation");
  const [template, setTemplate] = useState(DEFAULT_EXHIBITION_TEMPLATES.invitation);
  const [logStates, setLogStates] = useState<Record<string, LogState>>({});
  const [logErrors, setLogErrors] = useState<Record<string, string>>({});

  const instant = resolveExhibitionInstant(exhibition);
  const calendarUrl =
    instant && exhibition.isActive && typeof window !== "undefined"
      ? `${window.location.origin}${exhibitionIcsPath(exhibition.id)}`
      : "";

  function messageFor(row: ExhibitionRegistration): string {
    return renderExhibitionMessage(template, {
      name: row.name,
      registrationNumber: row.registrationNumber,
      title: exhibition.title,
      schedule: describeExhibitionSchedule(instant),
      venue: exhibition.venueName,
      mapUrl: exhibition.mapUrl,
      calendarUrl,
    });
  }

  function changeKind(next: ExhibitionMessageKind) {
    setKind(next);
    setTemplate(DEFAULT_EXHIBITION_TEMPLATES[next]);
  }

  async function recordOpened(row: ExhibitionRegistration, message: string) {
    setLogStates((s) => ({ ...s, [row.id]: "saving" }));
    try {
      await onLogOpened(row, kind, message);
      setLogStates((s) => ({ ...s, [row.id]: "saved" }));
    } catch (err) {
      setLogStates((s) => ({ ...s, [row.id]: "failed" }));
      setLogErrors((s) => ({
        ...s,
        [row.id]: err instanceof Error ? err.message : "تعذّر تسجيل المحاولة",
      }));
    }
  }

  if (recipients.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted">
        <h2 className="mb-1 font-semibold text-foreground">رسائل واتساب اليدوية</h2>
        حدّد العملاء من جدول المسجلين لتجهيز دعوة أو تذكير. كل المسجلين وافقوا على
        التواصل عبر واتساب عند التسجيل.
      </section>
    );
  }

  const preview = messageFor(recipients[0]!);
  const tooLong = recipients.some(
    (r) => messageFor(r).length > EXHIBITION_MESSAGE_MAX_LENGTH,
  );

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">
          رسائل واتساب اليدوية — {recipients.length} عميل محدد
        </h2>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-primary hover:underline"
        >
          إلغاء التحديد
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-1 text-sm">نوع الرسالة</legend>
            {(["invitation", "reminder"] as const).map((k) => (
              <label
                key={k}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm ${
                  kind === k ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="exhibition-message-kind"
                  value={k}
                  checked={kind === k}
                  onChange={() => changeKind(k)}
                  className="sr-only"
                />
                {MESSAGE_KIND_LABELS_AR[k]}
              </label>
            ))}
          </fieldset>
          {!instant ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              لم يُنشر الموعد بعد: سيظهر في الرسالة «سيتم الإعلان عنه قريبًا»، وسطر
              التقويم يُحذف تلقائيًا.
            </p>
          ) : null}
          <label className="block text-sm">
            نص الرسالة (يمكن تعديله قبل الإرسال)
            <textarea
              rows={9}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm leading-relaxed"
            />
          </label>
          <p className="text-xs text-muted">
            المتغيرات:{" "}
            {EXHIBITION_MESSAGE_PLACEHOLDERS.map((p) => (
              <span key={p.token} className="me-2 inline-block" title={p.label}>
                <code className="rounded bg-surface px-1">{p.token}</code>
              </span>
            ))}
          </p>
          <button
            type="button"
            onClick={() => setTemplate(DEFAULT_EXHIBITION_TEMPLATES[kind])}
            className="text-xs text-primary hover:underline"
          >
            استرجاع النص الافتراضي
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm">معاينة ({recipients[0]!.name})</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-emerald-50 p-3 font-sans text-sm leading-relaxed text-foreground">
            {preview}
          </pre>
          {tooLong ? (
            <p className="text-xs text-red-700">
              الرسالة أطول من {EXHIBITION_MESSAGE_MAX_LENGTH} حرف. اختصر النص قبل الإرسال.
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted">
          اضغط «فتح واتساب» لكل عميل، راجع الرسالة في واتساب ثم اضغط إرسال بنفسك.
          نسجّل أن المحادثة فُتحت؛ واتساب لا يؤكد وصول الرسالة.
        </p>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {recipients.map((row) => {
            const message = messageFor(row);
            const state = logStates[row.id];
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium" title={row.name}>
                  {row.name}
                  <span className="ms-2 font-mono text-xs text-muted">
                    <bdi dir="ltr">{localMobile(row.phone)}</bdi>
                  </span>
                </span>
                {state === "saving" ? (
                  <span className="text-xs text-muted">جاري تسجيل المحاولة…</span>
                ) : null}
                {state === "saved" ? (
                  <span className="text-xs text-emerald-700">فُتحت المحادثة وسُجّلت</span>
                ) : null}
                {state === "failed" ? (
                  <span className="flex items-center gap-2 text-xs text-red-700">
                    {logErrors[row.id]}
                    <button
                      type="button"
                      onClick={() => void recordOpened(row, message)}
                      className="font-medium underline"
                    >
                      إعادة تسجيل المحاولة
                    </button>
                  </span>
                ) : null}
                {tooLong ? (
                  <span className="rounded-xl bg-surface px-3 py-1.5 text-xs text-muted">
                    فتح واتساب
                  </span>
                ) : (
                  <a
                    href={whatsAppUrl(row.phone, message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => void recordOpened(row, message)}
                    className="rounded-xl bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {state === "saved" ? "فتح مرة أخرى" : "فتح واتساب"}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
