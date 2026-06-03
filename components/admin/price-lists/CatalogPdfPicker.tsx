"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import {
  AUDIENCE_LABELS_AR,
  publicCatalogFilePdfPath,
} from "@/lib/constants/catalogChannels";
import { listAllFileCardsAdmin } from "@/lib/services/fileCards";
import type { FileCard } from "@/lib/types/models";
import { PdfFirstPagePreview } from "@/components/public/PdfFirstPagePreview";

export type CatalogPdfSelection = {
  cardId: string;
  pdfUrl: string;
  coverImage: string;
  title: string;
};

type Props = {
  audience: CatalogAudience;
  value: string | null;
  onChange: (selection: CatalogPdfSelection | null) => void;
};

function cardMatchesAudience(card: FileCard, audience: CatalogAudience): boolean {
  if (audience === "wholesale") {
    return card.audience === "wholesale" || !card.audience;
  }
  return card.audience === audience;
}

export function catalogPdfSelectionFromCard(card: FileCard): CatalogPdfSelection {
  return {
    cardId: card.id,
    pdfUrl: publicCatalogFilePdfPath(card.audience, card.id, card.version),
    coverImage: card.thumbnailUrl?.trim() ?? "",
    title: card.title || card.fileName,
  };
}

export function CatalogPdfPicker({ audience, value, onChange }: Props) {
  const [cards, setCards] = useState<FileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const all = await listAllFileCardsAdmin();
        if (!cancelled) setCards(all);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const byAudience = cards.filter(
      (c) => c.isActive && cardMatchesAudience(c, audience),
    );
    const q = query.trim().toLowerCase();
    if (!q) return byAudience;
    return byAudience.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.fileName.toLowerCase().includes(q),
    );
  }, [cards, audience, query]);

  const selected = value ? cards.find((c) => c.id === value) : undefined;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <span className="text-sm font-medium text-foreground">
          ربط بملف PDF من الكتالوج
        </span>
        <p className="mt-0.5 text-xs text-muted">
          اختر ملفًا من {AUDIENCE_LABELS_AR[audience]} — يُملأ رابط PDF وصورة
          الغلاف تلقائيًا
        </p>
      </div>

      <input
        type="search"
        placeholder="بحث باسم الملف…"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <p className="text-sm text-muted">جاري تحميل الملفات…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-amber-800">
          لا توجد ملفات PDF نشطة في {AUDIENCE_LABELS_AR[audience]}. أضف ملفًا من
          قسم الملفات أولًا.
        </p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {filtered.map((card) => {
            const active = value === card.id;
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      active ? null : catalogPdfSelectionFromCard(card),
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border p-2 text-right transition ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:bg-surface"
                  }`}
                >
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    {card.thumbnailUrl ? (
                      <Image
                        src={card.thumbnailUrl}
                        alt=""
                        fill
                        className="object-contain p-0.5"
                        unoptimized
                      />
                    ) : (
                      <PdfFirstPagePreview
                        cardId={card.id}
                        pdfUrl={publicCatalogFilePdfPath(
                          card.audience,
                          card.id,
                          card.version,
                        )}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {card.title || card.fileName}
                    </span>
                    <span className="block truncate text-xs text-muted" dir="ltr">
                      {card.fileName}
                    </span>
                  </span>
                  {active ? (
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      مُختار
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-border bg-white">
            {selected.thumbnailUrl ? (
              <Image
                src={selected.thumbnailUrl}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <PdfFirstPagePreview
                cardId={selected.id}
                pdfUrl={publicCatalogFilePdfPath(
                  selected.audience,
                  selected.id,
                  selected.version,
                )}
                className="h-full w-full"
              />
            )}
          </div>
          <div className="min-w-0 text-xs text-muted">
            <p className="font-medium text-foreground">{selected.title}</p>
            <p className="mt-1 truncate" dir="ltr">
              PDF:{" "}
              {publicCatalogFilePdfPath(
                selected.audience,
                selected.id,
                selected.version,
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
