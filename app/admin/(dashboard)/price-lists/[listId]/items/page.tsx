"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { getPriceList } from "@/lib/services/priceLists";
import {
  listItemsForListAdmin,
  updatePriceListItemClient,
} from "@/lib/services/priceListItems";
import type { PriceList, PriceListItem } from "@/lib/types/priceList";
import { useToast } from "@/components/ui/Toast";

type Props = { params: Promise<{ listId: string }> };

export default function AdminPriceListItemsPage({ params }: Props) {
  const { listId } = use(params);
  const [list, setList] = useState<PriceList | null>(null);
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  function load() {
    setLoading(true);
    setLoadError(null);
    void Promise.all([getPriceList(listId), listItemsForListAdmin(listId)])
      .then(([l, its]) => {
        setList(l);
        setItems(its);
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : "فشل تحميل الأصناف";
        setLoadError(msg);
        toast(msg, "error");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [l, its] = await Promise.all([
          getPriceList(listId),
          listItemsForListAdmin(listId),
        ]);
        setList(l);
        setItems(its);
        setLoadError(null);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "فشل تحميل الأصناف";
        setLoadError(msg);
        toast(msg, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [listId, toast]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return items;
    return items.filter(
      (it) =>
        it.sku.toLowerCase().includes(n) || it.name.toLowerCase().includes(n),
    );
  }, [items, q]);

  async function saveItem(
    item: PriceListItem,
    patch: { price?: number; isActive?: boolean },
  ) {
    try {
      await updatePriceListItemClient(listId, item.sku, patch);
      toast("تم التحديث", "success");
      load();
    } catch {
      toast("فشل التحديث", "error");
    }
  }

  if (loading) return <p className="text-muted">جاري التحميل…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/admin/price-lists/${listId}`} className="text-sm text-primary">
          ← {list?.name ?? "القائمة"}
        </Link>
        <h1 className="text-xl font-semibold text-foreground">أصناف القائمة</h1>
      </div>

      <input
        type="search"
        placeholder="بحث بالاسم أو SKU…"
        className="w-full max-w-md rounded-xl border border-border px-3 py-2 text-sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loadError ? (
        <p className="text-sm text-red-800">{loadError}</p>
      ) : null}
      {!loadError && filtered.length === 0 ? (
        <p className="text-muted">لا توجد أصناف</p>
      ) : null}
      {!loadError && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onSave={(patch) => void saveItem(item, patch)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ItemRow({
  item,
  onSave,
}: {
  item: PriceListItem;
  onSave: (patch: { price?: number; isActive?: boolean }) => void;
}) {
  const [price, setPrice] = useState(String(item.price));

  return (
    <div
      className={`rounded-2xl border p-4 ${
        item.isActive ? "border-border bg-card" : "border-amber-200 bg-amber-50/50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted" dir="ltr">
            {item.sku}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave({ isActive: !item.isActive })}
          className="text-xs text-primary hover:underline"
        >
          {item.isActive ? "تعطيل" : "تفعيل"}
        </button>
      </div>
      <label className="mt-3 block text-xs">
        السعر
        <input
          type="number"
          className="mt-1 w-full max-w-xs rounded-lg border border-border px-2 py-1.5"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="mt-2 text-sm text-primary hover:underline"
        onClick={() => {
          const n = Number(price);
          if (!Number.isFinite(n)) return;
          onSave({ price: n });
        }}
      >
        حفظ التعديلات
      </button>
    </div>
  );
}
