"use client";

import { useCallback, useEffect, useState } from "react";
import type { FileCard, FileFolder } from "@/lib/types/models";
import { listActiveFileCards } from "@/lib/services/fileCards";
import { listActiveFileFolders } from "@/lib/services/fileFolders";

export function useFileCards() {
  const [cards, setCards] = useState<FileCard[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, f] = await Promise.all([
        listActiveFileCards(),
        listActiveFileFolders(),
      ]);
      setCards(c);
      setFolders(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
      setCards([]);
      setFolders([]);
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

  return { cards, folders, loading, error, refetch };
}
