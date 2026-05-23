"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getClientFirestore,
  syncAuthTokenForFirestore,
} from "@/lib/firebase/client";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import type {
  PriceList,
  PriceListLastImportReport,
} from "@/lib/types/priceList";
import { normalizeSlug } from "@/lib/utils/slug";

const COLLECTION = "price_lists";

function fromDoc(id: string, data: Record<string, unknown>): PriceList {
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
    createdAt: (data.createdAt as PriceList["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as PriceList["updatedAt"]) ?? null,
  };
}

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

export type PriceListWriteInput = {
  name: string;
  audience: CatalogAudience;
  slug?: string;
  pdfUrl?: string;
  coverImage?: string;
  linkedFileCardId?: string;
};

export async function listPriceListsAdmin(): Promise<PriceList[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const q = query(collection(db, COLLECTION), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getPriceList(id: string): Promise<PriceList | null> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function createPriceListClient(
  input: PriceListWriteInput,
): Promise<string> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const ref = doc(collection(db, COLLECTION));
  const slug = normalizeSlug(input.slug || input.name) || `list-${Date.now()}`;
  await setDoc(ref, {
    name: input.name.trim(),
    audience: input.audience,
    slug,
    pdfUrl: input.pdfUrl?.trim() ?? "",
    coverImage: input.coverImage?.trim() ?? "",
    linkedFileCardId: input.linkedFileCardId?.trim() ?? "",
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePriceListClient(
  id: string,
  patch: Partial<
    Pick<
      PriceList,
      | "name"
      | "slug"
      | "pdfUrl"
      | "coverImage"
      | "linkedFileCardId"
      | "isActive"
      | "audience"
    >
  >,
): Promise<void> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name != null) data.name = patch.name.trim();
  if (patch.slug != null) data.slug = normalizeSlug(patch.slug);
  if (patch.pdfUrl != null) data.pdfUrl = patch.pdfUrl.trim();
  if (patch.coverImage != null) data.coverImage = patch.coverImage.trim();
  if (patch.linkedFileCardId != null) {
    data.linkedFileCardId = patch.linkedFileCardId.trim();
  }
  if (patch.isActive != null) data.isActive = patch.isActive;
  if (patch.audience != null) data.audience = patch.audience;
  await updateDoc(doc(db, COLLECTION, id), data);
}

/** POST via Admin SDK API — reliable create when Firestore rules/token race. */
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

export async function listActivePriceListsForAudience(
  audience: CatalogAudience,
): Promise<PriceList[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true),
    where("audience", "==", audience),
    orderBy("name"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getPriceListBySlug(
  slug: string,
  audience: CatalogAudience,
): Promise<PriceList | null> {
  const db = getClientFirestore();
  const q = query(
    collection(db, COLLECTION),
    where("slug", "==", slug),
    where("audience", "==", audience),
    where("isActive", "==", true),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return fromDoc(d.id, d.data() as Record<string, unknown>);
}
