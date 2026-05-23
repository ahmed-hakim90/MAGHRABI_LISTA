"use client";

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getClientFirestore,
  syncAuthTokenForFirestore,
} from "@/lib/firebase/client";
import type { PriceListItem } from "@/lib/types/priceList";
import { priceListItemDocId } from "@/lib/utils/slug";

const COLLECTION = "price_list_items";

function fromDoc(id: string, data: Record<string, unknown>): PriceListItem {
  return {
    id,
    listId: String(data.listId ?? ""),
    sku: String(data.sku ?? ""),
    name: String(data.name ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    unit: String(data.unit ?? ""),
    cartonQty: Number(data.cartonQty ?? 1),
    price: Number(data.price ?? 0),
    sortOrder: Number(data.sortOrder ?? 0),
    isActive: Boolean(data.isActive),
    listIsActive: Boolean(data.listIsActive ?? true),
    createdAt: (data.createdAt as PriceListItem["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as PriceListItem["updatedAt"]) ?? null,
    lastImportedAt: (data.lastImportedAt as PriceListItem["lastImportedAt"]) ?? null,
  };
}

function sortBySortOrder(items: PriceListItem[]): PriceListItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.sku.localeCompare(b.sku));
}

export async function listItemsForListAdmin(
  listId: string,
): Promise<PriceListItem[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("listId", "==", listId)),
  );
  const items = snap.docs.map((d) =>
    fromDoc(d.id, d.data() as Record<string, unknown>),
  );
  return sortBySortOrder(items);
}

export async function listActiveItemsForList(
  listId: string,
): Promise<PriceListItem[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where("listId", "==", listId),
      where("listIsActive", "==", true),
      where("isActive", "==", true),
    ),
  );
  const items = snap.docs.map((d) =>
    fromDoc(d.id, d.data() as Record<string, unknown>),
  );
  return sortBySortOrder(items);
}

export async function updatePriceListItemClient(
  listId: string,
  sku: string,
  patch: Partial<Pick<PriceListItem, "price" | "imageUrl" | "isActive" | "name">>,
): Promise<void> {
  const db = getClientFirestore();
  const id = priceListItemDocId(listId, sku);
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.price != null) data.price = patch.price;
  if (patch.imageUrl != null) data.imageUrl = patch.imageUrl.trim();
  if (patch.isActive != null) data.isActive = patch.isActive;
  if (patch.name != null) data.name = patch.name.trim();
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function adminApiFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
