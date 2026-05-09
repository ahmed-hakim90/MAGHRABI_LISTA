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

/** Fetches active catalog cards only while `enabled` is true (e.g. when a modal opens). */
export function useActiveFileCardsWhen(enabled: boolean) {
  const [cards, setCards] = useState<FileCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listActiveFileCards()
      .then((c) => {
        if (!cancelled) setCards(c);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "تعذر تحميل الملفات");
          setCards([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { cards, loading, error };
}
