"use client";

import { useState } from "react";
import type { ImportPreviewResult } from "@/lib/types/priceList";
import { useAdminApiToken } from "@/hooks/useAdminApiToken";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImportPreviewSummary } from "./ImportPreviewSummary";

const DEACTIVATE_CONFIRM_THRESHOLD = 10;

type Props = {
  listId: string;
  onImported?: () => void;
};

export function ExcelImportPanel({ listId, onImported }: Props) {
  const { getToken } = useAdminApiToken();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function runPreview() {
    if (!file) {
      toast("اختر ملف Excel أولًا", "error");
      return;
    }
    setBusy(true);
    setPreview(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("غير مصرّح");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("listId", listId);
      const res = await fetch("/api/admin/price-lists/import/preview", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json()) as {
        preview?: ImportPreviewResult;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "فشلت المعاينة");
      if (!data.preview) throw new Error("لا توجد معاينة");
      setPreview(data.preview);
      const { stats, rows } = data.preview;
      if (rows.length === 0) {
        toast("لا توجد أصناف صالحة للاستيراد في الملف", "error");
      } else if (stats.errors > 0) {
        toast(
          `معاينة: ${rows.length} صنف جاهز — يوجد ${stats.errors} خطأ يمنع بعض الصفوف`,
          "error",
        );
      } else if (stats.skipped > 0) {
        toast(
          `معاينة: ${rows.length} صنف — تم تخطي ${stats.skipped} صف`,
          "success",
        );
      } else {
        toast("تمت المعاينة بنجاح", "success");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "فشلت المعاينة", "error");
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!preview) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("غير مصرّح");
      const res = await fetch("/api/admin/price-lists/import/commit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preview }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "فشل الاستيراد");
      toast("تم استيراد القائمة بنجاح", "success");
      setPreview(null);
      setFile(null);
      onImported?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "فشل الاستيراد", "error");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  function requestCommit() {
    if (!preview) return;
    if (preview.rows.length === 0) {
      toast("لا توجد أصناف صالحة للاستيراد", "error");
      return;
    }
    if (preview.stats.errors > 0) {
      toast("يوجد أخطاء تمنع الاستيراد — راجع التفاصيل", "error");
      return;
    }
    if (preview.stats.deactivate >= DEACTIVATE_CONFIRM_THRESHOLD) {
      setConfirmOpen(true);
      return;
    }
    void runCommit();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground">استيراد Excel</h3>
      <p className="text-xs text-muted">
        الأعمدة: كود الصنف، اسم الصنف، السعر، الوحدة… الصفوف بدون كود تُتخطى عند
        الحفظ ويمكنك رفع الملف مرة أخرى لاحقًا.
      </p>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="block w-full text-sm"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setPreview(null);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !file}
          onClick={() => void runPreview()}
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "جاري المعالجة…" : "معاينة"}
        </button>
        <button
          type="button"
          disabled={
            busy ||
            !preview ||
            preview.rows.length === 0 ||
            preview.stats.errors > 0
          }
          onClick={() => requestCommit()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          تنفيذ الاستيراد
        </button>
      </div>
      {preview ? <ImportPreviewSummary preview={preview} /> : null}
      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد تعطيل أصناف"
        message={`سيتم تعطيل ${preview?.stats.deactivate ?? 0} صنف غير موجود في الملف الجديد. هل تريد المتابعة؟`}
        destructive
        confirmLabel="نعم، نفّذ"
        onConfirm={() => void runCommit()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
