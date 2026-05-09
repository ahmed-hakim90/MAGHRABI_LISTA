"use client";

import {
  FirestoreError,
  getDocs,
  getDocsFromCache,
  type Query,
  type QuerySnapshot,
} from "firebase/firestore";

function shouldTryFirestoreCache(err: unknown): boolean {
  if (err instanceof FirestoreError) {
    return (
      err.code === "unavailable" ||
      err.code === "deadline-exceeded" ||
      err.code === "resource-exhausted" ||
      err.code === "cancelled"
    );
  }
  return true;
}

/** Tries `getDocs`, then `getDocsFromCache` when the failure looks network-related. */
export async function getDocsWithCacheFallback<T>(
  q: Query<T>,
): Promise<QuerySnapshot<T>> {
  try {
    return await getDocs(q);
  } catch (e) {
    if (!shouldTryFirestoreCache(e)) throw e;
    try {
      return await getDocsFromCache(q);
    } catch {
      throw e;
    }
  }
}
