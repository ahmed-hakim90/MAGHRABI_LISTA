"use client";

import { useCallback, useMemo, useState } from "react";
import type { CartLine, PriceListItemPublic } from "@/lib/types/priceList";

export type CartState = Record<string, { selected: boolean; cartonQty: number }>;

export function usePriceListCart(items: PriceListItemPublic[]) {
  const [cart, setCart] = useState<CartState>({});

  const setSelected = useCallback((sku: string, selected: boolean) => {
    setCart((prev) => {
      const next = { ...prev };
      if (!selected) {
        delete next[sku];
        return next;
      }
      next[sku] = {
        selected: true,
        cartonQty: prev[sku]?.cartonQty && prev[sku].cartonQty >= 1 ? prev[sku].cartonQty : 1,
      };
      return next;
    });
  }, []);

  const setQty = useCallback((sku: string, raw: string) => {
    const n = parseInt(raw, 10);
    const qty = Number.isFinite(n) && n >= 1 ? n : 1;
    setCart((prev) => ({
      ...prev,
      [sku]: { selected: true, cartonQty: qty },
    }));
  }, []);

  const lines: CartLine[] = useMemo(() => {
    const result: CartLine[] = [];
    for (const item of items) {
      const c = cart[item.sku];
      if (!c?.selected) continue;
      result.push({
        sku: item.sku,
        name: item.name,
        cartonQty: c.cartonQty,
        price: item.price,
        unit: item.unit,
      });
    }
    return result;
  }, [items, cart]);

  const selectedCount = lines.length;

  return { cart, setSelected, setQty, lines, selectedCount };
}
