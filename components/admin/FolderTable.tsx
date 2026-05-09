"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FileFolder } from "@/lib/types/models";
import {
  deleteFileFolderAndContents,
  deleteFileFolderDetachCards,
  listAllFileFoldersAdmin,
  setFileFolderActive,
} from "@/lib/services/fileFolders";
import {
  backfillFileCardsAudience,
  backfillFileCardsFolderFields,
} from "@/lib/services/fileCards";
import { formatDisplayDate } from "@/lib/utils/dates";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function FolderTable() {
  const { user } = useAdminAuth();
  const [rows, setRows] = useState<FileFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAllFileFoldersAdmin();
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled || !user) return;
      try {
        await backfillFileCardsFolderFields(user.uid);
        await backfillFileCardsAudience(user.uid);
      } catch {
        /* non-blocking; old cards may simply stay unmigrated until next attempt */
      }
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load, user]);

  async function onToggle(folder: FileFolder) {
    if (!user) return;
    await setFileFolderActive(folder.id, !folder.isActive, user.uid);
    await load();
  }

  async function onDeleteFolderOnly(folder: FileFolder) {
    if (!user) return;
    if (
      !confirm(
        `حذف المجلد «${folder.name}» فقط؟ قوائم الأسعار داخله ستبقى محفوظة (بدون مجلد) في قاعدة البيانات والتخزين.`,
      )
    )
      return;
    await deleteFileFolderDetachCards(folder.id, user.uid);
    await load();
  }

  async function onDeleteFolderAndContents(folder: FileFolder) {
    if (!user) return;
    if (
      !confirm(
        `حذف المجلد «${folder.name}» وكل محتواه؟ سيتم حذف جميع قوائم الأسعار داخله نهائيًا من قاعدة البيانات والتخزين (PDF والصور المصغّرة). لا يمكن التراجع.`,
      )
    )
      return;
    await deleteFileFolderAndContents(folder.id);
    await load();
  }

  if (loading) {
    return <p className="text-muted">جاري تحميل المجلدات…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] text-start text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="p-3 font-medium">الاسم</th>
            <th className="p-3 font-medium">الترتيب</th>
            <th className="p-3 font-medium">نشط</th>
            <th className="p-3 font-medium">آخر تحديث</th>
            <th className="p-3 font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((folder) => (
            <tr key={folder.id} className="border-b border-border/80">
              <td className="max-w-[260px] p-3">
                <p className="font-medium text-foreground">{folder.name}</p>
                {folder.description ? (
                  <p className="line-clamp-2 text-xs text-muted">
                    {folder.description}
                  </p>
                ) : null}
              </td>
              <td className="p-3 text-muted">{folder.order}</td>
              <td className="p-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                    folder.isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {folder.isActive ? "نعم" : "لا"}
                </span>
              </td>
              <td className="p-3 text-muted">
                {formatDisplayDate(folder.updatedAt, "ar")}
              </td>
              <td className="p-3">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/folders/${folder.id}/edit`}
                    className="text-foreground underline"
                  >
                    تعديل
                  </Link>
                  <button
                    type="button"
                    className="text-start text-xs text-muted hover:text-foreground"
                    onClick={() => void onToggle(folder)}
                  >
                    {folder.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    className="text-start text-xs text-amber-800 hover:underline"
                    onClick={() => void onDeleteFolderOnly(folder)}
                  >
                    حذف المجلد (الملفات تبقى)
                  </button>
                  <button
                    type="button"
                    className="text-start text-xs font-medium text-red-700 hover:underline"
                    onClick={() => void onDeleteFolderAndContents(folder)}
                  >
                    حذف المجلد والملفات نهائيًا
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-muted">لا توجد مجلدات بعد.</p>
      ) : null}
    </div>
  );
}
