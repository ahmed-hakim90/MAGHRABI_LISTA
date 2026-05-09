"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FileCard, FileFolder } from "@/lib/types/models";
import {
  readCatalogSnapshot,
  writeCatalogSnapshot,
} from "@/lib/offline/catalogSnapshot";
import { listActiveFileCards } from "@/lib/services/fileCards";
import { listActiveFileFolders } from "@/lib/services/fileFolders";

function hasCatalogData(cards: FileCard[], folders: FileFolder[]) {
  return cards.length > 0 || folders.length > 0;
}

export function useFileCards() {
  const [cards, setCards] = useState<FileCard[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const cardsRef = useRef(cards);
  const foldersRef = useRef(folders);
  cardsRef.current = cards;
  foldersRef.current = folders;

  useLayoutEffect(() => {
    const snap = readCatalogSnapshot();
    if (!snap) return;
    setCards(snap.cards);
    setFolders(snap.folders);
  }, []);

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
      writeCatalogSnapshot(c, f);
      setStale(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load files";
      const local = readCatalogSnapshot();
      const prevC = cardsRef.current;
      const prevF = foldersRef.current;
      const nextC = prevC.length > 0 ? prevC : (local?.cards ?? []);
      const nextF = prevF.length > 0 ? prevF : (local?.folders ?? []);
      const has = hasCatalogData(nextC, nextF);
      setCards(nextC);
      setFolders(nextF);
      setStale(has);
      setError(has ? null : msg);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => {
      void refetch();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refetch]);

  return { cards, folders, loading, error, stale, refetch };
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
