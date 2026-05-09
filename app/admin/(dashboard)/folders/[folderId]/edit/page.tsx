"use client";

import { use, useEffect, useState } from "react";
import { FolderForm } from "@/components/admin/FolderForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getFileFolder } from "@/lib/services/fileFolders";
import type { FileFolder } from "@/lib/types/models";

export default function EditFolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const { user } = useAdminAuth();
  const [folder, setFolder] = useState<FileFolder | null | undefined>(undefined);

  useEffect(() => {
    void getFileFolder(folderId).then(setFolder);
  }, [folderId]);

  if (!user) return null;
  if (folder === undefined) {
    return <p className="text-muted">جاري التحميل…</p>;
  }
  if (!folder) {
    return <p className="text-muted">المجلد غير موجود.</p>;
  }

  return <FolderForm mode="edit" uid={user.uid} initial={folder} />;
}
