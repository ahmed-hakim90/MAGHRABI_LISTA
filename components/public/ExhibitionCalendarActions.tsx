"use client";

import type { PublicExhibition } from "@/lib/types/exhibition";

const ACTION_CLASS =
  "flex min-h-touch w-full items-center justify-center gap-2 rounded-xl border border-brand-gold/50 bg-white px-4 py-2.5 text-sm font-semibold text-brand-gray transition hover:border-brand-gold hover:bg-brand-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red";

/** Shown only for an announced schedule; before that there is no real event to add. */
export function ExhibitionCalendarActions({
  calendar,
}: {
  calendar: NonNullable<PublicExhibition["calendar"]>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-brand-gray">إضافة الموعد إلى التقويم</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={calendar.googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ACTION_CLASS}
        >
          Google Calendar
        </a>
        <a href={calendar.icsPath} className={ACTION_CLASS}>
          Apple Calendar
        </a>
        <a
          href={`${calendar.icsPath}?download=1`}
          download
          className={ACTION_CLASS}
        >
          تحميل الدعوة (.ics)
        </a>
      </div>
    </div>
  );
}
