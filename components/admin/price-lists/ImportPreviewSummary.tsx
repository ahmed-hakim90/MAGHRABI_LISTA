"use client";

import type { ImportPreviewResult } from "@/lib/types/priceList";

type Props = {
  preview: ImportPreviewResult;
};

export function ImportPreviewSummary({ preview }: Props) {
  const { stats, errors } = preview;
  const blocking = errors.filter((e) => e.severity === "error");
  const skipped = errors.filter((e) => e.severity === "skipped");
  const warnings = errors.filter((e) => e.severity === "warning");

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground">ملخص المعاينة</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="جديد" value={stats.create} tone="green" />
        <Stat label="تحديث" value={stats.update} tone="blue" />
        <Stat label="تعطيل" value={stats.deactivate} tone="amber" />
        <Stat label="تخطي" value={stats.skipped} tone="slate" />
        <Stat label="أخطاء" value={stats.errors} tone="red" />
      </div>
      {preview.rows.length > 0 && stats.errors === 0 ? (
        <p className="text-sm text-green-800">
          {preview.rows.length} صنف جاهز للاستيراد
          {stats.skipped > 0
            ? ` — ${stats.skipped} صف متخطى (يمكن إعادة الرفع لاحقًا)`
            : ""}
        </p>
      ) : null}
      {stats.warnings > 0 ? (
        <p className="text-sm text-amber-800">تحذيرات: {stats.warnings}</p>
      ) : null}
      <IssueList title="صفوف متخطاة" items={skipped} tone="slate" />
      <IssueList title="أخطاء" items={blocking} tone="red" />
      <IssueList title="تحذيرات" items={warnings} tone="amber" />
    </div>
  );
}

function IssueList({
  title,
  items,
  tone,
}: {
  title: string;
  items: ImportPreviewResult["errors"];
  tone: "red" | "amber" | "slate";
}) {
  if (items.length === 0) return null;
  const styles = {
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
  };
  const titleColors = {
    red: "text-red-950",
    amber: "text-amber-950",
    slate: "text-slate-900",
  };
  return (
    <div
      className={`max-h-48 overflow-y-auto rounded-xl border p-3 ${styles[tone]}`}
    >
      <p className={`mb-2 text-sm font-medium ${titleColors[tone]}`}>{title}</p>
      <ul className="space-y-1 text-xs">
        {items.slice(0, 50).map((e, i) => (
          <li key={`${e.rowNumber}-${i}`}>
            صف {e.rowNumber}
            {e.sku ? ` (${e.sku})` : ""}: {e.message}
          </li>
        ))}
        {items.length > 50 ? <li>… و{items.length - 50} أخرى</li> : null}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "blue" | "amber" | "red" | "slate";
}) {
  const colors = {
    green: "bg-green-50 text-green-900 border-green-200",
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    red: "bg-red-50 text-red-900 border-red-200",
    slate: "bg-slate-50 text-slate-800 border-slate-200",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}
