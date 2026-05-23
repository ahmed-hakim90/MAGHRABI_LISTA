"use client";

import type { PriceListLastImportReport } from "@/lib/types/priceList";

type Props = {
  report: PriceListLastImportReport;
};

export function LastImportReportCard({ report }: Props) {
  const skipped = report.issues.filter((i) => i.severity === "skipped");
  const when = new Date(report.importedAt);
  const whenLabel = Number.isNaN(when.getTime())
    ? report.importedAt
    : when.toLocaleString("ar-EG");

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
      <h3 className="font-semibold text-foreground">آخر استيراد</h3>
      <p className="mt-1 text-xs text-muted">{whenLabel}</p>
      <p className="mt-2 text-foreground">
        جديد {report.create} · تحديث {report.update} · تعطيل {report.deactivate}
        {report.skipped > 0 ? ` · تخطي ${report.skipped}` : ""}
      </p>
      {skipped.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            صفوف متخطاة ({skipped.length})
          </summary>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted">
            {skipped.slice(0, 30).map((e, i) => (
              <li key={`${e.rowNumber}-${i}`}>
                صف {e.rowNumber}: {e.message}
              </li>
            ))}
            {skipped.length > 30 ? (
              <li>… و{skipped.length - 30} أخرى</li>
            ) : null}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
