"use client";

import { useCallback, useEffect, useState } from "react";
import type { FileCard } from "@/lib/types/models";
import { listActiveFileCards } from "@/lib/services/fileCards";

export function useFileCards() {
  const [cards, setCards] = useState<FileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listActiveFileCards();
      setCards(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) await refetch();
    })();
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  return { cards, loading, error, refetch };
}
