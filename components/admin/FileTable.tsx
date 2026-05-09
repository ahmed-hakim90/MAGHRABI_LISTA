"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FileCard } from "@/lib/types/models";
import {
  deleteFileCard,
  listAllFileCardsAdmin,
  replaceFileCardPdf,
  replaceFileCardThumbnail,
  setFileCardActive,
} from "@/lib/services/fileCards";
import { fireCatalogTextReindex } from "@/lib/services/catalogTextReindexClient";
import { PdfFirstPagePreview } from "@/components/public/PdfFirstPagePreview";
import { PdfThumbnailPlaceholder } from "@/components/public/PdfThumbnailPlaceholder";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { publicCatalogFilePdfPath } from "@/lib/constants/catalogChannels";
import { formatDisplayDate } from "@/lib/utils/dates";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function FileTable() {
  const { user } = useAdminAuth();
  const [rows, setRows] = useState<FileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadJob, setUploadJob] = useState<{
    label: string;
    progress: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAllFileCardsAdmin();
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onReplacePdf(card: FileCard, file: File | null) {
    if (!file || !user) return;
    setUploadJob({ label: "جاري رفع PDF…", progress: 0 });
    try {
      await replaceFileCardPdf(card.id, file, user.uid, {
        onProgress: (p) =>
          setUploadJob((j) => (j ? { ...j, progress: p } : null)),
      });
      try {
        const token = await user.getIdToken();
        void fireCatalogTextReindex(card.id, token);
      } catch {
        /* best-effort */
      }
      await load();
    } catch {
      /* surface via browser or future toast */
    } finally {
      setUploadJob(null);
    }
  }

  async function onReplaceThumb(card: FileCard, file: File | null) {
    if (!file || !user) return;
    setUploadJob({ label: "جاري رفع الصورة المصغّرة…", progress: 0 });
    try {
      await replaceFileCardThumbnail(card.id, file, user.uid, {
        onProgress: (p) =>
          setUploadJob((j) => (j ? { ...j, progress: p } : null)),
      });
      await load();
    } catch {
      /* surface via browser or future toast */
    } finally {
      setUploadJob(null);
    }
  }

  async function onToggle(card: FileCard) {
    if (!user) return;
    await setFileCardActive(card.id, !card.isActive, user.uid);
    await load();
  }

  async function onDelete(card: FileCard) {
    if (!user) return;
    if (!confirm(`حذف «${card.title}»؟`)) return;
    await deleteFileCard(card.id);
    await load();
  }

  if (loading) {
    return <p className="text-muted">جاري تحميل الملفات…</p>;
  }

  return (
    <div className="space-y-3">
      {uploadJob ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <ProgressBar label={uploadJob.label} value={uploadJob.progress} />
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-start text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="p-3 font-medium">مصغّر</th>
            <th className="p-3 font-medium">العنوان</th>
            <th className="p-3 font-medium">المجلد</th>
            <th className="p-3 font-medium">القناة</th>
            <th className="p-3 font-medium">التصنيف</th>
            <th className="p-3 font-medium">نشط</th>
            <th className="p-3 font-medium">آخر تحديث</th>
            <th className="p-3 font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((card) => (
            <tr key={card.id} className="border-b border-border/80">
              <td className="p-3">
                <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-surface">
                  {card.thumbnailUrl?.trim() ? (
                    <Image
                      src={card.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : card.isActive ? (
                    <PdfFirstPagePreview
                      cardId={card.id}
                      pdfUrl={publicCatalogFilePdfPath(card.audience, card.id)}
                    />
                  ) : (
                    <PdfThumbnailPlaceholder />
                  )}
                </div>
              </td>
              <td className="max-w-[200px] p-3 font-medium text-foreground">
                {card.title}
              </td>
              <td className="p-3 text-muted">
                {card.folderName ? (
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs ${
                      card.folderIsActive
                        ? "bg-surface text-foreground"
                        : "bg-neutral-100 text-neutral-500 line-through"
                    }`}
                  >
                    {card.folderName}
                  </span>
                ) : (
                  <span className="text-xs text-muted/70">—</span>
                )}
              </td>
              <td className="p-3 text-muted">
                {card.audience === "wholesale"
                  ? "جملة"
                  : card.audience === "retail"
                    ? "تجزئة"
                    : "بدون أسعار"}
              </td>
              <td className="p-3 text-muted">{card.category}</td>
              <td className="p-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                    card.isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {card.isActive ? "نعم" : "لا"}
                </span>
              </td>
              <td className="p-3 text-muted">
                {formatDisplayDate(card.updatedAt, "ar")}
              </td>
              <td className="p-3">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/files/${card.id}/edit`}
                    className="text-foreground underline"
                  >
                    تعديل
                  </Link>
                  <label className="cursor-pointer text-xs text-muted hover:text-foreground">
                    استبدال PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        void onReplacePdf(card, e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <label className="cursor-pointer text-xs text-muted hover:text-foreground">
                    استبدال المصغّرة
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        void onReplaceThumb(card, e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="text-start text-xs text-muted hover:text-foreground"
                    onClick={() => void onToggle(card)}
                  >
                    {card.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    className="text-start text-xs text-red-700 hover:underline"
                    onClick={() => void onDelete(card)}
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-muted">لا توجد ملفات بعد.</p>
        ) : null}
      </div>
    </div>
  );
}
