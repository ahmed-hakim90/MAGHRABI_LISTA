"use client";

import { Timestamp } from "firebase/firestore";
import type { FileCard, FileFolder } from "@/lib/types/models";

export const CATALOG_SNAPSHOT_STORAGE_KEY = "maghrabi-catalog-v2";

type WireCard = Omit<FileCard, "createdAt" | "updatedAt"> & {
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

type WireFolder = Omit<FileFolder, "createdAt" | "updatedAt"> & {
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

type CatalogSnapshotWire = {
  v: 2;
  savedAt: number;
  cards: WireCard[];
  folders: WireFolder[];
};

function tsToMs(t: FileCard["createdAt"]): number | null {
  if (t == null) return null;
  if (typeof (t as Timestamp).toMillis === "function") {
    return (t as Timestamp).toMillis();
  }
  return null;
}

function msToTs(ms: number | null): Timestamp | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  return Timestamp.fromMillis(ms);
}

function toWireCard(c: FileCard): WireCard {
  const { createdAt, updatedAt, ...rest } = c;
  return {
    ...rest,
    createdAtMs: tsToMs(createdAt),
    updatedAtMs: tsToMs(updatedAt),
  };
}

function fromWireCard(w: WireCard): FileCard {
  const { createdAtMs, updatedAtMs, ...rest } = w;
  return {
    ...rest,
    createdAt: msToTs(createdAtMs),
    updatedAt: msToTs(updatedAtMs),
  };
}

function toWireFolder(f: FileFolder): WireFolder {
  const { createdAt, updatedAt, ...rest } = f;
  return {
    ...rest,
    createdAtMs: tsToMs(createdAt),
    updatedAtMs: tsToMs(updatedAt),
  };
}

function fromWireFolder(w: WireFolder): FileFolder {
  const { createdAtMs, updatedAtMs, ...rest } = w;
  return {
    ...rest,
    createdAt: msToTs(createdAtMs),
    updatedAt: msToTs(updatedAtMs),
  };
}

export type CatalogSnapshot = {
  cards: FileCard[];
  folders: FileFolder[];
  savedAt: number;
};

export function readCatalogSnapshot(): CatalogSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATALOG_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogSnapshotWire;
    if (parsed.v !== 2 || !Array.isArray(parsed.cards) || !Array.isArray(parsed.folders)) {
      return null;
    }
    return {
      cards: parsed.cards.map(fromWireCard),
      folders: parsed.folders.map(fromWireFolder),
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function writeCatalogSnapshot(cards: FileCard[], folders: FileFolder[]): void {
  if (typeof window === "undefined") return;
  try {
    const wire: CatalogSnapshotWire = {
      v: 2,
      savedAt: Date.now(),
      cards: cards.map(toWireCard),
      folders: folders.map(toWireFolder),
    };
    window.localStorage.setItem(CATALOG_SNAPSHOT_STORAGE_KEY, JSON.stringify(wire));
  } catch {
    /* quota or private mode */
  }
}
