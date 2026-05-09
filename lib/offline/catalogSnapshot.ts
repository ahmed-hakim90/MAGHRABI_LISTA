"use client";

import { Timestamp } from "firebase/firestore";
import {
  type CatalogAudience,
  normalizeAudienceFromDoc,
} from "@/lib/constants/catalogChannels";
import type { FileCard, FileFolder } from "@/lib/types/models";

export function catalogSnapshotStorageKey(audience: CatalogAudience): string {
  return `maghrabi-catalog-v3-${audience}`;
}

type WireCard = Omit<FileCard, "createdAt" | "updatedAt"> & {
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

type WireFolder = Omit<FileFolder, "createdAt" | "updatedAt"> & {
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

type CatalogSnapshotWire = {
  v: 3;
  audience?: CatalogAudience;
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
  const r = rest as Omit<FileCard, "createdAt" | "updatedAt">;
  return {
    ...r,
    audience: normalizeAudienceFromDoc(
      (w as { audience?: unknown }).audience,
    ),
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

export function readCatalogSnapshot(
  audience: CatalogAudience,
): CatalogSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(catalogSnapshotStorageKey(audience));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogSnapshotWire;
    if (
      parsed.v !== 3 ||
      !Array.isArray(parsed.cards) ||
      !Array.isArray(parsed.folders)
    ) {
      return null;
    }
    if (parsed.audience != null && parsed.audience !== audience) {
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

export function writeCatalogSnapshot(
  audience: CatalogAudience,
  cards: FileCard[],
  folders: FileFolder[],
): void {
  if (typeof window === "undefined") return;
  try {
    const wire: CatalogSnapshotWire = {
      v: 3,
      audience,
      savedAt: Date.now(),
      cards: cards.map(toWireCard),
      folders: folders.map(toWireFolder),
    };
    window.localStorage.setItem(
      catalogSnapshotStorageKey(audience),
      JSON.stringify(wire),
    );
  } catch {
    /* quota or private mode */
  }
}
