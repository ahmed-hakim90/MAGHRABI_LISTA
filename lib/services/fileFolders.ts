"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import type { FileFolder } from "@/lib/types/models";

function fromDoc(id: string, data: Record<string, unknown>): FileFolder {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive),
    createdAt: (data.createdAt as FileFolder["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as FileFolder["updatedAt"]) ?? null,
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
  };
}

export async function listActiveFileFolders(): Promise<FileFolder[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, "fileFolders"),
    where("isActive", "==", true),
    orderBy("order", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function listAllFileFoldersAdmin(): Promise<FileFolder[]> {
  const db = getClientFirestore();
  const q = query(collection(db, "fileFolders"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getFileFolder(id: string): Promise<FileFolder | null> {
  const db = getClientFirestore();
  const d = await getDoc(doc(db, "fileFolders", id));
  if (!d.exists()) return null;
  return fromDoc(d.id, d.data() as Record<string, unknown>);
}

export async function createFileFolder(input: {
  name: string;
  description: string;
  order: number;
  isActive: boolean;
  uid: string;
}): Promise<string> {
  const db = getClientFirestore();
  const folderId = doc(collection(db, "fileFolders")).id;
  await setDoc(doc(db, "fileFolders", folderId), {
    name: input.name.trim(),
    description: input.description.trim(),
    order: input.order,
    isActive: input.isActive,
    createdBy: input.uid,
    updatedBy: input.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return folderId;
}

/**
 * Update folder fields and propagate name/active changes to all linked file cards
 * so the public listing and security rules see consistent denormalized data.
 */
export async function updateFileFolder(
  folderId: string,
  input: {
    name: string;
    description: string;
    order: number;
    isActive: boolean;
    uid: string;
  },
): Promise<void> {
  const db = getClientFirestore();
  const folderRef = doc(db, "fileFolders", folderId);
  const prevSnap = await getDoc(folderRef);
  const prev = prevSnap.exists()
    ? fromDoc(prevSnap.id, prevSnap.data() as Record<string, unknown>)
    : null;

  await updateDoc(folderRef, {
    name: input.name.trim(),
    description: input.description.trim(),
    order: input.order,
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
    updatedBy: input.uid,
  });

  const nameChanged = !prev || prev.name !== input.name.trim();
  const activeChanged = !prev || prev.isActive !== input.isActive;
  if (!nameChanged && !activeChanged) return;

  const cardsSnap = await getDocs(
    query(collection(db, "fileCards"), where("folderId", "==", folderId)),
  );
  if (cardsSnap.empty) return;

  const batch = writeBatch(db);
  for (const c of cardsSnap.docs) {
    batch.update(c.ref, {
      folderName: input.name.trim(),
      folderIsActive: input.isActive,
      updatedAt: serverTimestamp(),
      updatedBy: input.uid,
    });
  }
  await batch.commit();
}

export async function setFileFolderActive(
  folderId: string,
  isActive: boolean,
  uid: string,
): Promise<void> {
  const db = getClientFirestore();
  await updateDoc(doc(db, "fileFolders", folderId), {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
  const cardsSnap = await getDocs(
    query(collection(db, "fileCards"), where("folderId", "==", folderId)),
  );
  if (cardsSnap.empty) return;
  const batch = writeBatch(db);
  for (const c of cardsSnap.docs) {
    batch.update(c.ref, {
      folderIsActive: isActive,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  }
  await batch.commit();
}

/**
 * Deletes the folder and detaches all linked cards (sets folderId="" and folderIsActive=true).
 * Cards themselves are preserved.
 */
export async function deleteFileFolder(folderId: string, uid: string): Promise<void> {
  const db = getClientFirestore();
  const cardsSnap = await getDocs(
    query(collection(db, "fileCards"), where("folderId", "==", folderId)),
  );
  if (!cardsSnap.empty) {
    const batch = writeBatch(db);
    for (const c of cardsSnap.docs) {
      batch.update(c.ref, {
        folderId: "",
        folderName: "",
        folderIsActive: true,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }
    await batch.commit();
  }
  await deleteDoc(doc(db, "fileFolders", folderId));
}
