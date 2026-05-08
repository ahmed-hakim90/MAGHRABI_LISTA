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
import { ProgressBar } from "@/components/ui/ProgressBar";
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
    if (!confirm(`Delete “${card.title}”?`)) return;
    await deleteFileCard(card.id);
    await load();
  }

  if (loading) {
    return <p className="text-[#6B6B6B]">Loading files…</p>;
  }

  return (
    <div className="space-y-3">
      {uploadJob ? (
        <div className="rounded-2xl border border-[#E5E2DA] bg-white p-4 shadow-sm">
          <ProgressBar label={uploadJob.label} value={uploadJob.progress} />
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#E5E2DA] text-[#6B6B6B]">
            <th className="p-3 font-medium">Thumb</th>
            <th className="p-3 font-medium">Title</th>
            <th className="p-3 font-medium">Folder</th>
            <th className="p-3 font-medium">Category</th>
            <th className="p-3 font-medium">Active</th>
            <th className="p-3 font-medium">Updated</th>
            <th className="p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((card) => (
            <tr key={card.id} className="border-b border-[#E5E2DA]/80">
              <td className="p-3">
                <div className="relative h-12 w-16 overflow-hidden rounded-lg bg-[#F7F6F3]">
                  {card.thumbnailUrl ? (
                    <Image
                      src={card.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
              </td>
              <td className="max-w-[200px] p-3 font-medium text-[#2F3437]">
                {card.title}
              </td>
              <td className="p-3 text-[#6B6B6B]">
                {card.folderName ? (
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs ${
                      card.folderIsActive
                        ? "bg-[#F7F6F3] text-[#2F3437]"
                        : "bg-neutral-100 text-neutral-500 line-through"
                    }`}
                  >
                    {card.folderName}
                  </span>
                ) : (
                  <span className="text-xs text-[#6B6B6B]/70">—</span>
                )}
              </td>
              <td className="p-3 text-[#6B6B6B]">{card.category}</td>
              <td className="p-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                    card.isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {card.isActive ? "Yes" : "No"}
                </span>
              </td>
              <td className="p-3 text-[#6B6B6B]">
                {formatDisplayDate(card.updatedAt)}
              </td>
              <td className="p-3">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/files/${card.id}/edit`}
                    className="text-[#2F3437] underline"
                  >
                    Edit
                  </Link>
                  <label className="cursor-pointer text-xs text-[#6B6B6B] hover:text-[#2F3437]">
                    Replace PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        void onReplacePdf(card, e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <label className="cursor-pointer text-xs text-[#6B6B6B] hover:text-[#2F3437]">
                    Replace thumbnail
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
                    className="text-left text-xs text-[#6B6B6B] hover:text-[#2F3437]"
                    onClick={() => void onToggle(card)}
                  >
                    {card.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="text-left text-xs text-red-700 hover:underline"
                    onClick={() => void onDelete(card)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-[#6B6B6B]">No files yet.</p>
        ) : null}
      </div>
    </div>
  );
}
