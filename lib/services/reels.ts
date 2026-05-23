"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getClientFirestore,
  syncAuthTokenForFirestore,
} from "@/lib/firebase/client";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import type { CatalogReel, ReelAudience } from "@/lib/types/reels";
import type { VideoProvider } from "@/lib/types/reels";

const COLLECTION = "catalog_reels";

function parseReelAudience(raw: unknown): ReelAudience {
  if (raw === "all") return "all";
  return normalizeAudienceFromDoc(raw);
}

function fromDoc(id: string, data: Record<string, unknown>): CatalogReel {
  return {
    id,
    title: String(data.title ?? ""),
    sourceUrl: String(data.sourceUrl ?? ""),
    provider: (data.provider as VideoProvider) ?? "unknown",
    embedUrl: String(data.embedUrl ?? ""),
    audience: parseReelAudience(data.audience),
    sortOrder: Number(data.sortOrder ?? 0),
    likeCount: Number(data.likeCount ?? 0),
    isActive: Boolean(data.isActive ?? true),
    createdAt: (data.createdAt as CatalogReel["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as CatalogReel["updatedAt"]) ?? null,
  };
}

function reelFromApiRecord(raw: Record<string, unknown>): CatalogReel {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    sourceUrl: String(raw.sourceUrl ?? ""),
    provider: (raw.provider as VideoProvider) ?? "unknown",
    embedUrl: String(raw.embedUrl ?? ""),
    audience: parseReelAudience(raw.audience),
    sortOrder: Number(raw.sortOrder ?? 0),
    likeCount: Number(raw.likeCount ?? 0),
    isActive: Boolean(raw.isActive ?? true),
    createdAt: null,
    updatedAt: null,
  };
}

/** يقرأ عبر Admin SDK — لا يعتمد على قواعد Firestore على المتصفح */
export async function listReelsAdminViaApi(
  token: string,
): Promise<CatalogReel[]> {
  const res = await reelsAdminApiFetch("/api/admin/reels", token);
  const data = (await res.json()) as { reels?: Record<string, unknown>[]; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "فشل تحميل الفيديوهات");
  }
  const rows = Array.isArray(data.reels) ? data.reels : [];
  return rows
    .map((r) => reelFromApiRecord({ ...r, id: r.id }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ar"));
}

export async function listReelsAdmin(): Promise<CatalogReel[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => fromDoc(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ar"));
}

export async function getReelAdmin(id: string): Promise<CatalogReel | null> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function listActiveReelsForAudienceClient(
  audience: CatalogAudience,
): Promise<CatalogReel[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("isActive", "==", true)),
  );
  return snap.docs
    .map((d) => fromDoc(d.id, d.data() as Record<string, unknown>))
    .filter(
      (r) =>
        r.embedUrl && (r.audience === "all" || r.audience === audience),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ar"));
}

export async function reelsAdminApiFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
