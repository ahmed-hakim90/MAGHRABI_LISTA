"use client";

import { use, useEffect, useState } from "react";
import { FileForm } from "@/components/admin/FileForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getFileCard } from "@/lib/services/fileCards";
import type { FileCard } from "@/lib/types/models";

export default function EditFilePage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = use(params);
  const { user } = useAdminAuth();
  const [card, setCard] = useState<FileCard | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoadError(null);
      setCard(undefined);
      void getFileCard(cardId)
        .then((c) => {
          if (!cancelled) setCard(c);
        })
        .catch((e) => {
          if (!cancelled) {
            setLoadError(
              e instanceof Error ? e.message : "تعذّر تحميل الملف من Firestore.",
            );
            setCard(null);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  if (!user) return null;
  if (loadError) {
    return (
      <p className="text-red-800" role="alert">
        {loadError}
      </p>
    );
  }
  if (card === undefined) {
    return <p className="text-muted">جاري التحميل…</p>;
  }
  if (!card) {
    return <p className="text-muted">الملف غير موجود.</p>;
  }

  return (
    <FileForm
      mode="edit"
      uid={user.uid}
      initial={card}
      idTokenGetter={() => user.getIdToken()}
    />
  );
}
