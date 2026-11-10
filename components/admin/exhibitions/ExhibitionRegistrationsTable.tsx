"use client";

import {
  ATTENDANCE_STATUS_LABELS_AR,
  MESSAGE_KIND_LABELS_AR,
} from "@/lib/constants/exhibition";
import type { RegistrationListQuery } from "@/lib/services/exhibitions";
import type {
  AttendanceStatus,
  ExhibitionRegistration,
} from "@/lib/types/exhibition";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  confirmed: "bg-emerald-50 text-emerald-800",
  declined: "bg-surface text-muted",
};

function formatDateTime(ms: number | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function localMobile(waDigits: string): string {
  return waDigits.startsWith("20") ? `0${waDigits.slice(2)}` : waDigits;
}

export function ExhibitionRegistrationsTable({
  rows,
  loading,
  error,
  hasMore,
  query,
  selectedIds,
  updatingId,
  onQueryChange,
  onRetry,
  onLoadMore,
  onToggleSelect,
  onToggleSelectPage,
  onAttendanceChange,
}: {
  rows: ExhibitionRegistration[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  query: RegistrationListQuery;
  selectedIds: ReadonlySet<string>;
  updatingId: string | null;
  onQueryChange: (patch: Partial<RegistrationListQuery>) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onToggleSelect: (row: ExhibitionRegistration) => void;
  onToggleSelectPage: () => void;
  onAttendanceChange: (row: ExhibitionRegistration, status: AttendanceStatus) => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const filtered = Boolean(query.status || query.contacted || query.search.trim());

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <h2 className="me-auto font-semibold text-foreground">المسجلون</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onQueryChange({ search: String(data.get("q") ?? "") });
          }}
        >
          <label className="text-xs text-muted">
            بحث برقم الموبايل أو رقم التسجيل
            <input
              key={query.search}
              name="q"
              dir="ltr"
              defaultValue={query.search}
              placeholder="01012345678 / RM27-0001"
              className="mt-1 block w-56 rounded-xl border border-border px-3 py-2 text-left text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border border-border px-3 py-2 text-sm text-foreground"
          >
            بحث
          </button>
        </form>
        <label className="text-xs text-muted">
          حالة الحضور
          <select
            value={query.status}
            onChange={(e) =>
              onQueryChange({ status: e.target.value as RegistrationListQuery["status"] })
            }
            className="mt-1 block rounded-xl border border-border px-3 py-2 text-sm text-foreground"
          >
            <option value="">الكل</option>
            {(Object.keys(ATTENDANCE_STATUS_LABELS_AR) as AttendanceStatus[]).map((s) => (
              <option key={s} value={s}>
                {ATTENDANCE_STATUS_LABELS_AR[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          التواصل
          <select
            value={query.contacted}
            onChange={(e) =>
              onQueryChange({
                contacted: e.target.value as RegistrationListQuery["contacted"],
              })
            }
            className="mt-1 block rounded-xl border border-border px-3 py-2 text-sm text-foreground"
          >
            <option value="">الكل</option>
            <option value="no">لم يتم التواصل</option>
            <option value="yes">تم التواصل</option>
          </select>
        </label>
        {filtered ? (
          <button
            type="button"
            onClick={() => onQueryChange({ status: "", contacted: "", search: "" })}
            className="pb-2 text-xs text-primary hover:underline"
          >
            مسح الفلاتر
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="font-medium underline">
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm [&_td]:px-2 [&_th]:px-2">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted">
              <th className="w-10 py-2 text-start">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectPage}
                  disabled={rows.length === 0}
                  aria-label="تحديد كل المسجلين المعروضين"
                  className="h-4 w-4"
                />
              </th>
              <th className="py-2 text-start font-medium">رقم التسجيل</th>
              <th className="py-2 text-start font-medium">العميل</th>
              <th className="py-2 text-start font-medium">الموبايل</th>
              <th className="py-2 text-start font-medium">الحضور</th>
              <th className="py-2 text-start font-medium">حالة الحضور</th>
              <th className="py-2 text-start font-medium">آخر تواصل</th>
              <th className="py-2 text-start font-medium">التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 align-middle">
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => onToggleSelect(r)}
                    aria-label={`تحديد ${r.name}`}
                    className="h-4 w-4"
                  />
                </td>
                <td className="whitespace-nowrap py-2 font-mono text-xs" dir="ltr">
                  {r.registrationNumber}
                </td>
                <td className="max-w-[12rem] truncate py-2 font-medium" title={r.name}>
                  {r.name}
                </td>
                <td className="whitespace-nowrap py-2 font-mono text-xs" dir="ltr">
                  {localMobile(r.phone)}
                </td>
                <td className="py-2">{r.attendeeCount}</td>
                <td className="py-2">
                  <select
                    value={r.attendanceStatus}
                    disabled={updatingId === r.id}
                    onChange={(e) =>
                      onAttendanceChange(r, e.target.value as AttendanceStatus)
                    }
                    aria-label={`حالة حضور ${r.name}`}
                    className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.attendanceStatus]} disabled:opacity-50`}
                  >
                    {(Object.keys(ATTENDANCE_STATUS_LABELS_AR) as AttendanceStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {ATTENDANCE_STATUS_LABELS_AR[s]}
                        </option>
                      ),
                    )}
                  </select>
                </td>
                <td className="py-2 text-xs text-muted">
                  {r.contactCount > 0 && r.lastMessageKind
                    ? `${MESSAGE_KIND_LABELS_AR[r.lastMessageKind]} · ${formatDateTime(r.lastContactedAtMs)} (${r.contactCount})`
                    : "لم يتم التواصل"}
                </td>
                <td className="py-2 text-xs text-muted">{formatDateTime(r.createdAtMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? <p className="text-sm text-muted">جاري التحميل…</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-muted">
          {filtered ? "لا توجد نتائج مطابقة." : "لا يوجد مسجلون بعد."}
        </p>
      ) : null}
      {hasMore && !loading ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          عرض المزيد
        </button>
      ) : null}
    </section>
  );
}
