"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase/client";
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
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive),
    createdAt: (data.createdAt as FileCard["createdAt"]) ?? null,
    updatedAt: (data.updatedAt as FileCard["updatedAt"]) ?? null,
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
    version: Number(data.version ?? 1),
  };
}

export async function listActiveFileCards(): Promise<FileCard[]> {
  const db = getClientFirestore();
  const q = query(
    collection(db, "fileCards"),
    where("isActive", "==", true),
    orderBy("order", "asc"),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
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

export async function createFileCard(input: {
  title: string;
  description: string;
  category: string;
  tags: string[];
  order: number;
  isActive: boolean;
  pdfFile: File;
  thumbnailFile: File;
  uid: string;
}): Promise<string> {
  const db = getClientFirestore();
  const st = getClientStorage();
  const base = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    tags: input.tags,
    order: input.order,
    isActive: input.isActive,
    fileType: "pdf",
    storageFolder: STORAGE_FOLDER,
    thumbnailUrl: "",
    thumbnailPath: "",
    fileUrl: "",
    filePath: "",
    fileName: input.pdfFile.name,
    fileSize: input.pdfFile.size,
    version: 1,
    createdBy: input.uid,
    updatedBy: input.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const refDoc = await addDoc(collection(db, "fileCards"), base);
  const cardId = refDoc.id;
  const pdfPath = getPdfPath(cardId);
  const thumbPath = getThumbnailPath(cardId);
  const pdfRef = ref(st, pdfPath);
  const thumbRef = ref(st, thumbPath);
  const thumbBlob = await fileToWebpBlob(input.thumbnailFile);
  await uploadBytes(pdfRef, input.pdfFile, { contentType: "application/pdf" });
  await uploadBytes(thumbRef, thumbBlob, {
    contentType: thumbBlob.type || "image/webp",
  });
  const fileUrl = await getDownloadURL(pdfRef);
  const thumbnailUrl = await getDownloadURL(thumbRef);
  await updateDoc(doc(db, "fileCards", cardId), {
    filePath: pdfPath,
    fileUrl,
    thumbnailPath: thumbPath,
    thumbnailUrl,
    updatedAt: serverTimestamp(),
    updatedBy: input.uid,
  });
  return cardId;
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
    updatedAt: serverTimestamp(),
    updatedBy: input.uid,
  });
}

export async function replaceFileCardPdf(
  cardId: string,
  pdfFile: File,
  uid: string,
): Promise<void> {
  const db = getClientFirestore();
  const st = getClientStorage();
  const pdfPath = getPdfPath(cardId);
  const pdfRef = ref(st, pdfPath);
  await uploadBytes(pdfRef, pdfFile, { contentType: "application/pdf" });
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
}

export async function replaceFileCardThumbnail(
  cardId: string,
  thumbnailFile: File,
  uid: string,
): Promise<void> {
  const db = getClientFirestore();
  const st = getClientStorage();
  const thumbPath = getThumbnailPath(cardId);
  const thumbRef = ref(st, thumbPath);
  const thumbBlob = await fileToWebpBlob(thumbnailFile);
  await uploadBytes(thumbRef, thumbBlob, {
    contentType: thumbBlob.type || "image/webp",
  });
  const thumbnailUrl = await getDownloadURL(thumbRef);
  await updateDoc(doc(db, "fileCards", cardId), {
    thumbnailUrl,
    thumbnailPath: thumbPath,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
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
