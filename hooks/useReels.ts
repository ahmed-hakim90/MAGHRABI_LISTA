"use client";

import { useEffect, useState } from "react";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import type { CatalogReelPublic } from "@/lib/types/reels";

export function useReels(audience: CatalogAudience) {
  const [reels, setReels] = useState<CatalogReelPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/reels?audience=${encodeURIComponent(audience)}`,
        );
        const data = (await res.json()) as {
          reels?: CatalogReelPublic[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "تعذّر تحميل الفيديوهات");
        if (!cancelled) setReels(data.reels ?? []);
      } catch (e) {
        if (!cancelled) {
          setReels([]);
          setError(
            e instanceof Error ? e.message : "تعذّر تحميل الفيديوهات",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audience]);

  return { reels, loading, error };
}
