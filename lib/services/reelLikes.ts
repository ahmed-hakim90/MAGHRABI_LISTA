"use client";

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import {
  getLocallyLikedReelIds,
  getReelVisitorId,
  setLocallyLikedReelIds,
} from "@/lib/utils/reelVisitor";

const REELS = "catalog_reels";
const LIKES = "catalog_reel_likes";

function likeDocId(reelId: string, visitorId: string) {
  return `${reelId}__${visitorId}`;
}

export async function fetchReelLikeCount(reelId: string): Promise<number> {
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, REELS, reelId));
  if (!snap.exists()) return 0;
  return Number(snap.data().likeCount ?? 0);
}

export async function toggleReelLike(
  reelId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const visitorId = getReelVisitorId();
  const db = getClientFirestore();
  const likeRef = doc(db, LIKES, likeDocId(reelId, visitorId));
  const reelRef = doc(db, REELS, reelId);

  const liked = await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);
    const reelSnap = await tx.get(reelRef);
    if (!reelSnap.exists()) throw new Error("الفيديو غير موجود");

    const current = Number(reelSnap.data().likeCount ?? 0);
    if (likeSnap.exists()) {
      tx.delete(likeRef);
      tx.update(reelRef, { likeCount: Math.max(0, current - 1) });
      return false;
    }
    tx.set(likeRef, {
      reelId,
      visitorId,
      createdAt: serverTimestamp(),
    });
    tx.update(reelRef, { likeCount: current + 1 });
    return true;
  });

  const local = getLocallyLikedReelIds();
  if (liked) local.add(reelId);
  else local.delete(reelId);
  setLocallyLikedReelIds(local);

  const count = await fetchReelLikeCount(reelId);
  return { liked, likeCount: count };
}

export function isReelLikedLocally(reelId: string): boolean {
  return getLocallyLikedReelIds().has(reelId);
}

export async function syncLocalLikedFromFirestore(
  reelIds: string[],
): Promise<Set<string>> {
  const visitorId = getReelVisitorId();
  const db = getClientFirestore();
  const liked = new Set<string>();
  await Promise.all(
    reelIds.map(async (reelId) => {
      const snap = await getDoc(
        doc(db, LIKES, likeDocId(reelId, visitorId)),
      );
      if (snap.exists()) liked.add(reelId);
    }),
  );
  setLocallyLikedReelIds(liked);
  return liked;
}
