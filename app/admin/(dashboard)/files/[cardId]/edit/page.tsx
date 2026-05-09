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

  useEffect(() => {
    void getFileCard(cardId).then(setCard);
  }, [cardId]);

  if (!user) return null;
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
