"use client";

import type { PriceListItem } from "@/lib/types/priceList";

function fromApiRecord(id: string, data: Record<string, unknown>): PriceListItem {
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
    createdAt: null,
    updatedAt: null,
    lastImportedAt: null,
  };
}

function sortBySortOrder(items: PriceListItem[]): PriceListItem[] {
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.sku.localeCompare(b.sku),
  );
}

/** يقرأ عبر Admin SDK — لا يعتمد على قواعد Firestore على المتصفح */
export async function listItemsForListAdmin(
  listId: string,
  token: string,
): Promise<PriceListItem[]> {
  const res = await fetch(`/api/admin/price-lists/${listId}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as {
    items?: Record<string, unknown>[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "فشل تحميل الأصناف");
  const rows = Array.isArray(data.items) ? data.items : [];
  const items = rows.map((row) =>
    fromApiRecord(String(row.id ?? ""), row as Record<string, unknown>),
  );
  return sortBySortOrder(items);
}

export async function updatePriceListItemViaApi(
  listId: string,
  sku: string,
  patch: Partial<Pick<PriceListItem, "price" | "imageUrl" | "isActive" | "name">>,
  token: string,
): Promise<void> {
  const res = await fetch(`/api/admin/price-lists/${listId}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sku, ...patch }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "فشل التحديث");
}
