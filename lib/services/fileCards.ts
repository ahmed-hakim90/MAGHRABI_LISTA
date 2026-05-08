"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase/client";
import { runResumableUpload } from "@/lib/firebase/storageUpload";
import type { FileCard } from "@/lib/types/models";
import {
  getPdfPath,
  getThumbnailPath,
  STORAGE_FOLDER,
} from "@/lib/utils/storagePaths";
import { fileToWebpBlob } from "@/lib/utils/imageWebp";

function fromDoc(
  id: string,
  data: Record<string, unknown>,
): FileCard {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? ""),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    thumbnailUrl: String(data.thumbnailUrl ?? ""),
    thumbnailPath: String(data.thumbnailPath ?? ""),
    fileUrl: String(data.fileUrl ?? ""),
    filePath: String(data.filePath ?? ""),
    fileName: String(data.fileName ?? ""),
    fileSize: Number(data.fileSize ?? 0),
    fileType: "pdf",
    storageFolder: String(data.storageFolder ?? STORAGE_FOLDER),
    folderId: String(data.folderId ?? ""),
    folderName: String(data.folderName ?? ""),
    folderIsActive:
      data.folderIsActive === undefined
        ? true
        : Boolean(data.folderIsActive),
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive),
    createdAt: (data.createdAt as FileCard["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as FileCard["updatedAt"]) ?? null,
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
    version: Number(data.version ?? 1),
    productCount: (() => {
      const v = data.productCount;
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    })(),
    viewCount: Number(data.viewCount ?? 0),
  };
}

export async function listActiveFileCards(): Promise<FileCard[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, "fileCards"),
    where("isActive", "==", true),
    where("folderIsActive", "==", true),
    orderBy("order", "asc"),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

/**
 * Set defaults for the folder denormalization fields on legacy cards so the
 * public query (which filters on folderIsActive) still returns them.
 * Idempotent: writes only the cards that are missing the fields.
 */
export async function backfillFileCardsFolderFields(
  uid: string,
): Promise<number> {
  const db = getClientFirestore();
  const snap = await getDocs(collection(db, "fileCards"));
  const targets = snap.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    return (
      data.folderIsActive === undefined ||
      data.folderId === undefined ||
      data.folderName === undefined
    );
  });
  if (targets.length === 0) return 0;
  const batch = writeBatch(db);
  for (const d of targets) {
    const data = d.data() as Record<string, unknown>;
    batch.update(d.ref, {
      folderId: data.folderId === undefined ? "" : data.folderId,
      folderName: data.folderName === undefined ? "" : data.folderName,
      folderIsActive:
        data.folderIsActive === undefined ? true : data.folderIsActive,
      updatedBy: uid,
    });
  }
  await batch.commit();
  return targets.length;
}

export async function listAllFileCardsAdmin(): Promise<FileCard[]> {
  const db = getClientFirestore();
  const q = query(collection(db, "fileCards"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getFileCard(id: string): Promise<FileCard | null> {
  const db = getClientFirestore();
  const d = await getDoc(doc(db, "fileCards", id));
  if (!d.exists()) return null;
  return fromDoc(d.id, d.data() as Record<string, unknown>);
}

export type UploadProgressHandler = (ratio01: number) => void;

export async function createFileCard(
  input: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    order: number;
    isActive: boolean;
    folderId: string;
    folderName: string;
    folderIsActive: boolean;
    productCount: number | null;
    pdfFile: File;
    thumbnailFile: File;
    uid: string;
  },
  opts?: { onProgress?: UploadProgressHandler },
): Promise<string> {
  const on = opts?.onProgress;
  const report = (offset: number, weight: number, local: number) => {
    on?.(offset + local * weight);
  };
  const db = getClientFirestore();
  const st = getClientStorage();
  const cardId = doc(collection(db, "fileCards")).id;
  const pdfPath = getPdfPath(cardId);
  const thumbPath = getThumbnailPath(cardId);
  const pdfRef = ref(st, pdfPath);
  const thumbRef = ref(st, thumbPath);
  const thumbBlob = await fileToWebpBlob(input.thumbnailFile);
  try {
    await runResumableUpload(
      pdfRef,
      input.pdfFile,
      { contentType: "application/pdf" },
      (r) => report(0, 0.72, r),
    );
    await runResumableUpload(
      thumbRef,
      thumbBlob,
      { contentType: thumbBlob.type || "image/webp" },
      (r) => report(0.72, 0.24, r),
    );
    on?.(0.96);
    const fileUrl = await getDownloadURL(pdfRef);
    const thumbnailUrl = await getDownloadURL(thumbRef);
    await setDoc(doc(db, "fileCards", cardId), {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      tags: input.tags,
      order: input.order,
      isActive: input.isActive,
      folderId: input.folderId,
      folderName: input.folderName,
      folderIsActive: input.folderIsActive,
      fileType: "pdf",
      storageFolder: STORAGE_FOLDER,
      thumbnailUrl,
      thumbnailPath: thumbPath,
      fileUrl,
      filePath: pdfPath,
      fileName: input.pdfFile.name,
      fileSize: input.pdfFile.size,
      version: 1,
      productCount: input.productCount,
      viewCount: 0,
      createdBy: input.uid,
      updatedBy: input.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    on?.(1);
    return cardId;
  } catch (e) {
    try {
      await deleteObject(pdfRef);
    } catch {
      /* ignore */
    }
    try {
      await deleteObject(thumbRef);
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export async function updateFileCardMeta(
  cardId: string,
  input: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    order: number;
    isActive: boolean;
    folderId: string;
    folderName: string;
    folderIsActive: boolean;
    productCount: number | null;
    uid: string;
  },
): Promise<void> {
  const db = getClientFirestore();
  await updateDoc(doc(db, "fileCards", cardId), {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    tags: input.tags,
    order: input.order,
    isActive: input.isActive,
    folderId: input.folderId,
    folderName: input.folderName,
    folderIsActive: input.folderIsActive,
    productCount: input.productCount,
    updatedAt: serverTimestamp(),
    updatedBy: input.uid,
  });
}

export async function replaceFileCardPdf(
  cardId: string,
  pdfFile: File,
  uid: string,
  opts?: { onProgress?: UploadProgressHandler },
): Promise<void> {
  const on = opts?.onProgress;
  const db = getClientFirestore();
  const st = getClientStorage();
  const pdfPath = getPdfPath(cardId);
  const pdfRef = ref(st, pdfPath);
  await runResumableUpload(
    pdfRef,
    pdfFile,
    { contentType: "application/pdf" },
    (r) => on?.(r * 0.92),
  );
  on?.(0.94);
  const fileUrl = await getDownloadURL(pdfRef);
  await updateDoc(doc(db, "fileCards", cardId), {
    fileUrl,
    filePath: pdfPath,
    fileName: pdfFile.name,
    fileSize: pdfFile.size,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
    version: increment(1),
  });
  on?.(1);
}

export async function replaceFileCardThumbnail(
  cardId: string,
  thumbnailFile: File,
  uid: string,
  opts?: { onProgress?: UploadProgressHandler },
): Promise<void> {
  const on = opts?.onProgress;
  const db = getClientFirestore();
  const st = getClientStorage();
  const thumbPath = getThumbnailPath(cardId);
  const thumbRef = ref(st, thumbPath);
  const thumbBlob = await fileToWebpBlob(thumbnailFile);
  await runResumableUpload(
    thumbRef,
    thumbBlob,
    { contentType: thumbBlob.type || "image/webp" },
    (r) => on?.(r * 0.92),
  );
  on?.(0.94);
  const thumbnailUrl = await getDownloadURL(thumbRef);
  await updateDoc(doc(db, "fileCards", cardId), {
    thumbnailUrl,
    thumbnailPath: thumbPath,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
  on?.(1);
}

export async function setFileCardActive(
  cardId: string,
  isActive: boolean,
  uid: string,
): Promise<void> {
  const db = getClientFirestore();
  await updateDoc(doc(db, "fileCards", cardId), {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function deleteFileCard(cardId: string): Promise<void> {
  const db = getClientFirestore();
  const st = getClientStorage();
  const snap = await getDoc(doc(db, "fileCards", cardId));
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, unknown>;
  const fp = String(data.filePath ?? "");
  const tp = String(data.thumbnailPath ?? "");
  try {
    if (fp) await deleteObject(ref(st, fp));
  } catch {
    /* ignore */
  }
  try {
    if (tp) await deleteObject(ref(st, tp));
  } catch {
    /* ignore */
  }
  await deleteDoc(doc(db, "fileCards", cardId));
}
