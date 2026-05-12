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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoadError(null);
      setFolder(undefined);
      void getFileFolder(folderId)
        .then((f) => {
          if (!cancelled) setFolder(f);
        })
        .catch((e) => {
          if (!cancelled) {
            setLoadError(
              e instanceof Error ? e.message : "تعذّر تحميل المجلد من Firestore.",
            );
            setFolder(null);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  if (!user) return null;
  if (loadError) {
    return (
      <p className="text-red-800" role="alert">
        {loadError}
      </p>
    );
  }
  if (folder === undefined) {
    return <p className="text-muted">جاري التحميل…</p>;
  }
  if (!folder) {
    return <p className="text-muted">المجلد غير موجود.</p>;
  }

  return <FolderForm mode="edit" uid={user.uid} initial={folder} />;
}
