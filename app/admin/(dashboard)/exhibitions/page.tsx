"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreateExhibitionForm } from "@/components/admin/exhibitions/CreateExhibitionForm";
import { ExhibitionRegistrationsTable } from "@/components/admin/exhibitions/ExhibitionRegistrationsTable";
import { ExhibitionSettingsForm } from "@/components/admin/exhibitions/ExhibitionSettingsForm";
import { ExhibitionWhatsAppPanel } from "@/components/admin/exhibitions/ExhibitionWhatsAppPanel";
import { useToast } from "@/components/ui/Toast";
import { useAdminApiToken } from "@/hooks/useAdminApiToken";
import {
  createExhibitionAdmin,
  downloadRegistrationsExcel,
  getExhibitionAdmin,
  listExhibitionsAdmin,
  listRegistrationsAdmin,
  logWhatsAppOpenedAdmin,
  setAttendanceStatusAdmin,
  updateExhibitionAdmin,
  type RegistrationListQuery,
} from "@/lib/services/exhibitions";
import type {
  AttendanceStatus,
  Exhibition,
  ExhibitionMessageKind,
  ExhibitionRegistration,
  ExhibitionStats,
  ExhibitionSummary,
} from "@/lib/types/exhibition";
import type {
  ExhibitionPatch,
  NewExhibitionInput,
} from "@/lib/utils/exhibitionValidation";

const EMPTY_QUERY: RegistrationListQuery = {
  status: "",
  contacted: "",
  search: "",
  cursor: "",
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function AdminExhibitionsPage() {
  const { getToken } = useAdminApiToken();
  const { toast } = useToast();

  const [summaries, setSummaries] = useState<ExhibitionSummary[] | null>(null);
  const [summariesError, setSummariesError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState(false);

  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [stats, setStats] = useState<ExhibitionStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState<RegistrationListQuery>(EMPTY_QUERY);
  const [rows, setRows] = useState<ExhibitionRegistration[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, ExhibitionRegistration>>(
    () => new Map(),
  );
  const rowsRequest = useRef(0);

  const requireToken = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error("انتهت الجلسة — سجّل الدخول مرة أخرى");
    return token;
  }, [getToken]);

  const loadSummaries = useCallback(
    async (preferId?: string) => {
      try {
        const token = await requireToken();
        setSummariesError(null);
        const list = await listExhibitionsAdmin(token);
        setSummaries(list);
        setSelectedId((current) => {
          if (preferId && list.some((e) => e.id === preferId)) return preferId;
          if (current && list.some((e) => e.id === current)) return current;
          return (list.find((e) => e.isActive) ?? list[0])?.id ?? "";
        });
      } catch (err) {
        setSummariesError(errorMessage(err, "تعذّر تحميل المعارض"));
      }
    },
    [requireToken],
  );

  const loadDetail = useCallback(
    async (id: string) => {
      try {
        const token = await requireToken();
        setDetailError(null);
        const data = await getExhibitionAdmin(token, id);
        setExhibition(data.exhibition);
        setStats(data.stats);
        setStatsError(data.statsError);
      } catch (err) {
        setDetailError(errorMessage(err, "تعذّر تحميل بيانات المعرض"));
      }
    },
    [requireToken],
  );

  const loadRows = useCallback(
    async (id: string, q: RegistrationListQuery, append: boolean) => {
      const request = ++rowsRequest.current;
      try {
        const token = await requireToken();
        if (request !== rowsRequest.current) return;
        setRowsLoading(true);
        setRowsError(null);
        const page = await listRegistrationsAdmin(token, id, q);
        if (request !== rowsRequest.current) return;
        setRows((prev) => (append ? [...prev, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (request !== rowsRequest.current) return;
        setRowsError(errorMessage(err, "تعذّر تحميل المسجلين"));
      } finally {
        if (request === rowsRequest.current) setRowsLoading(false);
      }
    },
    [requireToken],
  );

  useEffect(() => {
    queueMicrotask(() => void loadSummaries());
  }, [loadSummaries]);

  useEffect(() => {
    if (!selectedId) return;
    queueMicrotask(() => {
      setExhibition(null);
      setStats(null);
      setRows([]);
      setSelected(new Map());
      void loadDetail(selectedId);
    });
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!selectedId) return;
    queueMicrotask(() => void loadRows(selectedId, { ...query, cursor: "" }, false));
  }, [selectedId, query, loadRows]);

  async function saveExhibition(patch: ExhibitionPatch, successMessage: string) {
    if (!exhibition) return;
    setBusy(true);
    try {
      const updated = await updateExhibitionAdmin(
        await requireToken(),
        exhibition.id,
        patch,
      );
      setExhibition(updated);
      toast(successMessage, "success");
      if (patch.isActive !== undefined || patch.title || patch.shortTitle) {
        void loadSummaries(updated.id);
      }
    } catch (err) {
      toast(errorMessage(err, "تعذّر الحفظ"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function createNewExhibition(input: NewExhibitionInput) {
    setBusy(true);
    try {
      await createExhibitionAdmin(await requireToken(), input);
      toast("تم إنشاء المعرض", "success");
      setCreating(false);
      await loadSummaries(input.id.trim().toLowerCase());
    } catch (err) {
      toast(errorMessage(err, "تعذّر إنشاء المعرض"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function changeAttendance(
    row: ExhibitionRegistration,
    status: AttendanceStatus,
  ) {
    if (!exhibition) return;
    setUpdatingId(row.id);
    try {
      await setAttendanceStatusAdmin(await requireToken(), exhibition.id, row.id, status);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, attendanceStatus: status } : r)),
      );
      void loadDetail(exhibition.id);
    } catch (err) {
      toast(errorMessage(err, "تعذّر تحديث حالة الحضور"), "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const logOpened = useCallback(
    async (row: ExhibitionRegistration, kind: ExhibitionMessageKind, message: string) => {
      if (!exhibition) return;
      await logWhatsAppOpenedAdmin(await requireToken(), exhibition.id, {
        registrationId: row.id,
        kind,
        message,
      });
      const contacted = {
        contactCount: row.contactCount + 1,
        lastMessageKind: kind,
        lastContactedAtMs: Date.now(),
      };
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...contacted } : r)));
      setSelected((prev) => {
        if (!prev.has(row.id)) return prev;
        const next = new Map(prev);
        next.set(row.id, { ...row, ...contacted });
        return next;
      });
      void loadDetail(exhibition.id);
    },
    [exhibition, requireToken, loadDetail],
  );

  async function exportExcel() {
    if (!exhibition) return;
    setExporting(true);
    try {
      await downloadRegistrationsExcel(await requireToken(), exhibition.id);
    } catch (err) {
      toast(errorMessage(err, "تعذّر تصدير الملف"), "error");
    } finally {
      setExporting(false);
    }
  }

  function toggleSelect(row: ExhibitionRegistration) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.set(row.id, row);
      return next;
    });
  }

  function toggleSelectPage() {
    setSelected((prev) => {
      const allOnPage = rows.length > 0 && rows.every((r) => prev.has(r.id));
      const next = new Map(prev);
      for (const r of rows) {
        if (allOnPage) next.delete(r.id);
        else next.set(r.id, r);
      }
      return next;
    });
  }

  const recipients = useMemo(() => [...selected.values()], [selected]);
  const selectedIds = useMemo(() => new Set(selected.keys()), [selected]);

  if (summariesError) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <h1 className="text-xl font-semibold text-foreground">معرض رمضان</h1>
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {summariesError}{" "}
          <button type="button" onClick={() => void loadSummaries()} className="underline">
            إعادة المحاولة
          </button>
        </p>
      </div>
    );
  }

  if (!summaries) {
    return <p className="text-muted">جاري التحميل…</p>;
  }

  if (summaries.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-xl font-semibold text-foreground">معرض رمضان</h1>
        <p className="text-sm text-muted">
          لا يوجد معرض بعد. أنشئ معرض رمضان 2027 لبدء استقبال التسجيلات.
        </p>
        <CreateExhibitionForm busy={busy} suggestDefaults onCreate={createNewExhibition} />
      </div>
    );
  }

  const statCards: { label: string; value: number | undefined }[] = [
    { label: "إجمالي المسجلين", value: stats?.registrations },
    { label: "إجمالي الحضور المتوقع", value: stats?.expectedAttendees },
    { label: "تم التواصل معهم", value: stats?.contacted },
    { label: "تأكيد الحضور", value: stats?.confirmed },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">معرض رمضان</h1>
          <p className="mt-1 text-sm text-muted">
            إدارة الدعوة، موعد المعرض، المسجلين، ورسائل واتساب اليدوية.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {summaries.length > 1 ? (
            <label className="text-xs text-muted">
              المعرض
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-1 block rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                {summaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortTitle}
                    {s.isActive ? " (ظاهر)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={!exhibition || exporting}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm disabled:opacity-50"
          >
            {exporting ? "جاري التصدير…" : "تصدير Excel"}
          </button>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm"
          >
            معرض جديد
          </button>
        </div>
      </div>

      {creating ? (
        <CreateExhibitionForm
          busy={busy}
          suggestDefaults={false}
          onCreate={createNewExhibition}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {detailError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {detailError}{" "}
          <button
            type="button"
            onClick={() => void loadDetail(selectedId)}
            className="underline"
          >
            إعادة المحاولة
          </button>
        </p>
      ) : null}

      {statsError ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          الإحصائيات غير متاحة مؤقتًا: {statsError}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {c.value === undefined ? "—" : c.value.toLocaleString("ar-EG")}
            </p>
          </div>
        ))}
      </div>

      {exhibition ? (
        <ExhibitionSettingsForm exhibition={exhibition} busy={busy} onSave={saveExhibition} />
      ) : !detailError ? (
        <p className="text-sm text-muted">جاري تحميل بيانات المعرض…</p>
      ) : null}

      {exhibition ? (
        <ExhibitionWhatsAppPanel
          exhibition={exhibition}
          recipients={recipients}
          onClearSelection={() => setSelected(new Map())}
          onLogOpened={logOpened}
        />
      ) : null}

      <ExhibitionRegistrationsTable
        rows={rows}
        loading={rowsLoading}
        error={rowsError}
        hasMore={Boolean(nextCursor)}
        query={query}
        selectedIds={selectedIds}
        updatingId={updatingId}
        onQueryChange={(patch) => setQuery((q) => ({ ...q, ...patch, cursor: "" }))}
        onRetry={() => void loadRows(selectedId, { ...query, cursor: "" }, false)}
        onLoadMore={() => {
          if (nextCursor) {
            void loadRows(selectedId, { ...query, cursor: nextCursor }, true);
          }
        }}
        onToggleSelect={toggleSelect}
        onToggleSelectPage={toggleSelectPage}
        onAttendanceChange={(row, status) => void changeAttendance(row, status)}
      />
    </div>
  );
}
