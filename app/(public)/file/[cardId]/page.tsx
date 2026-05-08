"use client";

import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { PdfViewer } from "@/components/public/PdfViewer";
import { getClientFirestore } from "@/lib/firebase/client";
import type { FileCard } from "@/lib/types/models";
import { STORAGE_FOLDER } from "@/lib/utils/storagePaths";

function fromSnap(
  id: string,
  data: Record<string, unknown>,
): FileCard {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? ""),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    thumbnailUrl: String(data.thumbnailUrl ?? ""),
    thumbnailPath: String(data.thumbnailPath ?? ""),
    fileUrl: String(data.fileUrl ?? ""),
    filePath: String(data.filePath ?? ""),
    fileName: String(data.fileName ?? ""),
    fileSize: Number(data.fileSize ?? 0),
    fileType: "pdf",
    storageFolder: String(data.storageFolder ?? STORAGE_FOLDER),
    folderId: String(data.folderId ?? ""),
    folderName: String(data.folderName ?? ""),
    folderIsActive:
      data.folderIsActive === undefined
        ? true
        : Boolean(data.folderIsActive),
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive),
    createdAt: (data.createdAt as FileCard["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as FileCard["updatedAt"]) ?? null,
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
    version: Number(data.version ?? 1),
  };
}

export default function FilePage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = use(params);
  const router = useRouter();
  const [card, setCard] = useState<FileCard | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = getClientFirestore();
        const snap = await getDoc(doc(db, "fileCards", cardId));
        if (cancelled) return;
        if (!snap.exists()) {
          setCard(null);
          return;
        }
        const c = fromSnap(snap.id, snap.data() as Record<string, unknown>);
        setCard(c);
      } catch {
        if (!cancelled) {
          setErr("Could not load this file.");
          setCard(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  if (card === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] text-[#6B6B6B]">
        Loading…
      </div>
    );
  }

  if (err || !card || !card.isActive || !card.folderIsActive || !card.fileUrl) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F6F3]">
        <header className="flex items-center gap-3 border-b border-[#E5E2DA] bg-white px-3 py-3">
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl px-3 py-1.5 text-sm text-[#2F3437] hover:bg-[#F7F6F3]"
          >
            ← Back
          </button>
        </header>
        <p className="p-8 text-center text-[#6B6B6B]">
          This file is not available.
        </p>
      </div>
    );
  }

  const proxyUrl = `/file/${cardId}/pdf`;
  const downloadUrl = `${proxyUrl}?download`;

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-[#F7F6F3]">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#E5E2DA] bg-white px-2 py-3 sm:gap-3 sm:px-3">
        <button
          type="button"
          onClick={goBack}
          className="shrink-0 rounded-xl px-2 py-1.5 text-sm font-medium text-[#2F3437] transition hover:bg-[#F7F6F3] sm:px-3"
        >
          ← Back
        </button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#2F3437] sm:text-base">
          {card.title}
        </h1>
        <a
          href={downloadUrl}
          download
          className="shrink-0 rounded-xl border border-[#E5E2DA] px-2 py-1.5 text-xs font-medium text-[#2F3437] hover:bg-[#F7F6F3] sm:px-3"
        >
          تحميل
        </a>
        <a
          href={proxyUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl border border-[#E5E2DA] px-2 py-1.5 text-xs font-medium text-[#2F3437] hover:bg-[#F7F6F3] sm:px-3"
        >
          Open
        </a>
      </header>
      <PdfViewer fileUrl={proxyUrl} title={card.title} />
    </div>
  );
}
