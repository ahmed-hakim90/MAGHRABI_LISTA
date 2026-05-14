"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  getClientFirestore,
  syncAuthTokenForFirestore,
} from "@/lib/firebase/client";
import type { NotificationDoc } from "@/lib/types/models";

function fromDoc(
  id: string,
  data: Record<string, unknown>,
): NotificationDoc & { id: string } {
  return {
    id,
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    targetCardId:
      data.targetCardId === null || data.targetCardId === undefined
        ? null
        : String(data.targetCardId),
    createdAt: (data.createdAt as NotificationDoc["createdAt"]) ?? null,
    createdBy: String(data.createdBy ?? ""),
    status: (data.status as NotificationDoc["status"]) ?? "draft",
  };
}

export async function listNotifications(): Promise<
  (NotificationDoc & { id: string })[]
> {
  await syncAuthTokenForFirestore();
  const db = getClientFirestore();
  const q = query(
    collection(db, "file_notifications"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    fromDoc(d.id, d.data() as Record<string, unknown>),
  );
}

export type NotifyBroadcastAudience =
  | "all"
  | "wholesale"
  | "retail"
  | "no_prices";

export async function sendNotificationRequest(input: {
  idToken: string;
  title: string;
  body: string;
  targetCardId: string | null;
  /** When no target file: which subscribers get the announcement */
  notifyAudience?: NotifyBroadcastAudience;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/notifications/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.idToken}`,
    },
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      targetCardId: input.targetCardId,
      notifyAudience: input.notifyAudience,
    }),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: j.error ?? res.statusText };
  }
  return { ok: true };
}
