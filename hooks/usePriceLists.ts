"use client";

import { useEffect, useState } from "react";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { listActivePriceListsForAudience } from "@/lib/services/priceLists";
import type { PriceList } from "@/lib/types/priceList";

export function usePriceLists(audience: CatalogAudience) {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listActivePriceListsForAudience(audience);
        if (!cancelled) setLists(data);
      } catch {
        if (!cancelled) setError("تعذّر تحميل قوائم الأسعار");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audience]);

  return { lists, loading, error };
}
