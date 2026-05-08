"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FileFolder } from "@/lib/types/models";
import {
  deleteFileFolder,
  listAllFileFoldersAdmin,
  setFileFolderActive,
} from "@/lib/services/fileFolders";
import { backfillFileCardsFolderFields } from "@/lib/services/fileCards";
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

  async function onDelete(folder: FileFolder) {
    if (!user) return;
    if (
      !confirm(
        `Delete folder “${folder.name}”? Files in this folder will be detached but kept.`,
      )
    )
      return;
    await deleteFileFolder(folder.id, user.uid);
    await load();
  }

  if (loading) {
    return <p className="text-[#6B6B6B]">Loading folders…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E2DA] bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#E5E2DA] text-[#6B6B6B]">
            <th className="p-3 font-medium">Name</th>
            <th className="p-3 font-medium">Order</th>
            <th className="p-3 font-medium">Active</th>
            <th className="p-3 font-medium">Updated</th>
            <th className="p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((folder) => (
            <tr key={folder.id} className="border-b border-[#E5E2DA]/80">
              <td className="max-w-[260px] p-3">
                <p className="font-medium text-[#2F3437]">{folder.name}</p>
                {folder.description ? (
                  <p className="line-clamp-2 text-xs text-[#6B6B6B]">
                    {folder.description}
                  </p>
                ) : null}
              </td>
              <td className="p-3 text-[#6B6B6B]">{folder.order}</td>
              <td className="p-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                    folder.isActive
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {folder.isActive ? "Yes" : "No"}
                </span>
              </td>
              <td className="p-3 text-[#6B6B6B]">
                {formatDisplayDate(folder.updatedAt)}
              </td>
              <td className="p-3">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/admin/folders/${folder.id}/edit`}
                    className="text-[#2F3437] underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="text-left text-xs text-[#6B6B6B] hover:text-[#2F3437]"
                    onClick={() => void onToggle(folder)}
                  >
                    {folder.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="text-left text-xs text-red-700 hover:underline"
                    onClick={() => void onDelete(folder)}
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
        <p className="p-6 text-center text-[#6B6B6B]">No folders yet.</p>
      ) : null}
    </div>
  );
}
