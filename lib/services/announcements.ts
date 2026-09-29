"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientFirestore, syncAuthTokenForFirestore } from "@/lib/firebase/client";
import type { AnnouncementItem } from "@/lib/types/models";
import {
  ANNOUNCEMENTS_SETTINGS_DOC,
  announcementToWire,
  parseAnnouncementItems,
} from "@/lib/utils/announcements";

export async function listAnnouncements(): Promise<AnnouncementItem[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const d = await getDoc(
    doc(db, "file_settings", ANNOUNCEMENTS_SETTINGS_DOC),
  );
  if (!d.exists()) return [];
  return parseAnnouncementItems(
    (d.data() as Record<string, unknown>).items,
  );
}

/** Rewrites the whole list (create/edit/delete/reorder) in one admin-gated merge write. */
export async function saveAnnouncements(
  items: AnnouncementItem[],
): Promise<AnnouncementItem[]> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const now = Date.now();
  const wire = items.map((item, index) =>
    announcementToWire({
      ...item,
      sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
      createdAt: item.createdAt ?? now,
      updatedAt: now,
    }),
  );
  await setDoc(
    doc(db, "file_settings", ANNOUNCEMENTS_SETTINGS_DOC),
    { items: wire, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return parseAnnouncementItems(wire);
}
