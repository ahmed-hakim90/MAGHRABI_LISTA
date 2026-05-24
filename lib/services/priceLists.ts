"use client";

import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import type {
  PriceList,
  PriceListLastImportReport,
  PriceListPublic,
} from "@/lib/types/priceList";
import { normalizeSlug } from "@/lib/utils/slug";

function parseLastImportReport(
  raw: unknown,
): PriceListLastImportReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.importedAt !== "string") return null;
  const issues = Array.isArray(r.issues) ? r.issues : [];
  return {
    importedAt: r.importedAt,
    create: Number(r.create ?? 0),
    update: Number(r.update ?? 0),
    deactivate: Number(r.deactivate ?? 0),
    skipped: Number(r.skipped ?? 0),
    warnings: Number(r.warnings ?? 0),
    errors: Number(r.errors ?? 0),
    issues: issues as PriceListLastImportReport["issues"],
  };
}

function fromApiRecord(id: string, data: Record<string, unknown>): PriceList {
  return {
    id,
    audience: normalizeAudienceFromDoc(data.audience),
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    pdfUrl: String(data.pdfUrl ?? ""),
    coverImage: String(data.coverImage ?? ""),
    linkedFileCardId: String(data.linkedFileCardId ?? ""),
    isActive: Boolean(data.isActive),
    lastImportReport: parseLastImportReport(data.lastImportReport),
    createdAt: null,
    updatedAt: null,
  };
}

function fromPublicRecord(p: PriceListPublic): PriceList {
  return {
    id: p.id,
    audience: p.audience,
    name: p.name,
    slug: p.slug,
    pdfUrl: p.pdfUrl,
    coverImage: p.coverImage,
    linkedFileCardId: p.linkedFileCardId ?? "",
    isActive: true,
    lastImportReport: null,
    createdAt: null,
    updatedAt: null,
  };
}

export type PriceListWriteInput = {
  name: string;
  audience: CatalogAudience;
  slug?: string;
  pdfUrl?: string;
  coverImage?: string;
  linkedFileCardId?: string;
};

/** يقرأ عبر Admin SDK — لا يعتمد على قواعد Firestore على المتصفح */
export async function listPriceListsAdmin(token: string): Promise<PriceList[]> {
  const res = await fetch("/api/admin/price-lists", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as {
    lists?: Record<string, unknown>[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "فشل تحميل القوائم");
  const rows = Array.isArray(data.lists) ? data.lists : [];
  return rows.map((row) =>
    fromApiRecord(String(row.id ?? ""), row as Record<string, unknown>),
  );
}

/** يقرأ عبر Admin SDK — لا يعتمد على قواعد Firestore على المتصفح */
export async function getPriceList(
  id: string,
  token: string,
): Promise<PriceList | null> {
  const res = await fetch(`/api/admin/price-lists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as {
    list?: Record<string, unknown>;
    error?: string;
  };
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(data.error ?? "فشل التحميل");
  if (!data.list) return null;
  return fromApiRecord(id, data.list);
}

export async function createPriceListViaApi(
  input: PriceListWriteInput,
  token: string,
): Promise<string> {
  const slug = normalizeSlug(input.slug || input.name) || undefined;
  const res = await fetch("/api/admin/price-lists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      audience: input.audience,
      slug,
      pdfUrl: input.pdfUrl?.trim() ?? "",
      coverImage: input.coverImage?.trim() ?? "",
      linkedFileCardId: input.linkedFileCardId?.trim() ?? "",
    }),
  });
  const data = (await res.json()) as { id?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "فشل الإنشاء");
  if (!data.id) throw new Error("لم يُرجع الخادم معرّف القائمة");
  return data.id;
}

/** PATCH via API — syncs listIsActive on all items when toggling isActive. */
export async function patchPriceListViaApi(
  listId: string,
  patch: Record<string, unknown>,
  token: string,
): Promise<void> {
  const res = await fetch(`/api/admin/price-lists/${listId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "فشل التحديث");
}

/** يقرأ عبر Admin SDK — لا يعتمد على قواعد Firestore على المتصفح */
export async function listActivePriceListsForAudience(
  audience: CatalogAudience,
): Promise<PriceList[]> {
  const res = await fetch(
    `/api/price-lists?audience=${encodeURIComponent(audience)}`,
  );
  const data = (await res.json()) as {
    lists?: PriceListPublic[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "تعذّر تحميل قوائم الأسعار");
  const rows = Array.isArray(data.lists) ? data.lists : [];
  return rows.map(fromPublicRecord);
}
