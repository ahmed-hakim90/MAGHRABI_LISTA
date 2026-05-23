"use client";

import Image from "next/image";
import { useState } from "react";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { AUDIENCE_LABELS_AR } from "@/lib/constants/catalogChannels";
import { normalizeSlug } from "@/lib/utils/slug";
import {
  CatalogPdfPicker,
  type CatalogPdfSelection,
} from "./CatalogPdfPicker";

const AUDIENCES: CatalogAudience[] = ["wholesale", "retail", "no_prices"];

type Props = {
  initial?: {
    name: string;
    slug: string;
    pdfUrl: string;
    coverImage: string;
    audience: CatalogAudience;
    linkedFileCardId?: string;
  };
  lockAudience?: boolean;
  onSubmit: (data: {
    name: string;
    slug: string;
    pdfUrl: string;
    coverImage: string;
    audience: CatalogAudience;
    linkedFileCardId: string;
  }) => Promise<void>;
  submitLabel?: string;
};

export function PriceListForm({
  initial,
  lockAudience = false,
  onSubmit,
  submitLabel = "حفظ",
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [pdfUrl, setPdfUrl] = useState(initial?.pdfUrl ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [linkedFileCardId, setLinkedFileCardId] = useState(
    initial?.linkedFileCardId ?? "",
  );
  const [audience, setAudience] = useState<CatalogAudience>(
    initial?.audience ?? "wholesale",
  );
  const [busy, setBusy] = useState(false);

  function applyPdfSelection(sel: CatalogPdfSelection | null) {
    if (!sel) {
      setLinkedFileCardId("");
      setPdfUrl("");
      setCoverImage("");
      return;
    }
    setLinkedFileCardId(sel.cardId);
    setPdfUrl(sel.pdfUrl);
    setCoverImage(sel.coverImage);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void onSubmit({
          name,
          slug: slug || normalizeSlug(name),
          pdfUrl,
          coverImage,
          audience,
          linkedFileCardId,
        }).finally(() => setBusy(false));
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">نوع القائمة / الرابط</span>
        <p className="mt-0.5 text-xs text-muted">
          تظهر القائمة فقط على رابط هذا النوع (جملة، تجزئة، أو بدون أسعار)
        </p>
        <select
          required
          disabled={lockAudience}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 disabled:opacity-60"
          value={audience}
          onChange={(e) => {
            const next = e.target.value as CatalogAudience;
            if (next !== audience) {
              setLinkedFileCardId("");
              setPdfUrl("");
              setCoverImage("");
            }
            setAudience(next);
          }}
        >
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {AUDIENCE_LABELS_AR[a]}
            </option>
          ))}
        </select>
      </label>

      <CatalogPdfPicker
        audience={audience}
        value={linkedFileCardId || null}
        onChange={applyPdfSelection}
      />

      <label className="block">
        <span className="text-sm font-medium">اسم القائمة</span>
        <input
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Slug (الرابط)</span>
        <input
          className="mt-1 w-full rounded-xl border border-border px-3 py-2"
          dir="ltr"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={normalizeSlug(name) || "my-list"}
        />
      </label>

      <details className="rounded-xl border border-border bg-muted/10 p-3">
        <summary className="cursor-pointer text-sm font-medium text-muted">
          تعديل يدوي لرابط PDF أو الغلاف (اختياري)
        </summary>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-medium">رابط PDF</span>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              dir="ltr"
              value={pdfUrl}
              onChange={(e) => {
                setPdfUrl(e.target.value);
                setLinkedFileCardId("");
              }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium">صورة الغلاف (URL)</span>
            <input
              type="url"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              dir="ltr"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </label>
          {coverImage ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-white">
              <Image
                src={coverImage}
                alt=""
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </details>

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "جاري الحفظ…" : submitLabel}
      </button>
    </form>
  );
}
