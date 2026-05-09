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
import {
  deleteObject,
  getBytes,
  getDownloadURL,
  ref,
} from "firebase/storage";
import {
  getClientFirestore,
  getClientStorage,
  syncAuthTokenForFirestore,
} from "@/lib/firebase/client";
import { getDocsWithCacheFallback } from "@/lib/firestore/queryWithCacheFallback";
import { runResumableUpload } from "@/lib/firebase/storageUpload";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeAudienceFromDoc } from "@/lib/constants/catalogChannels";
import type { FileCard } from "@/lib/types/models";
import {
  getPdfPathForAudience,
  getThumbnailPathForAudience,
  STORAGE_FOLDER,
} from "@/lib/utils/storagePaths";
import { fileToWebpBlob } from "@/lib/utils/imageWebp";

function fromDoc(
  id: string,
  data: Record<string, unknown>,
): FileCard {
  return {
    id,
    audience: normalizeAudienceFromDoc(data.audience),
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

export async function listActiveFileCards(
  audience: CatalogAudience,
): Promise<FileCard[]> {
  const db = getClientFirestore();
  /**
   * Legacy cards often omit `audience`. Firestore equality does not match
   * missing fields, but `fromDoc` + `normalizeAudienceFromDoc` treat that as
   * wholesale. For /wholesale we query without audience and filter in memory
   * so old data appears without requiring an admin backfill visit.
   */
  if (audience === "wholesale") {
    const q = query(
      collection(db, "fileCards"),
      where("isActive", "==", true),
      where("folderIsActive", "==", true),
      orderBy("order", "asc"),
      orderBy("updatedAt", "desc"),
    );
    const snap = await getDocsWithCacheFallback(q);
    return snap.docs
      .map((d) => fromDoc(d.id, d.data() as Record<string, unknown>))
      .filter((c) => c.audience === "wholesale");
  }
  const q = query(
    collection(db, "fileCards"),
    where("isActive", "==", true),
    where("folderIsActive", "==", true),
    where("audience", "==", audience),
    orderBy("order", "asc"),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocsWithCacheFallback(q);
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

/**
 * Sets audience = wholesale on cards missing it (idempotent).
 * Required so filtered public queries return legacy documents.
 */
export async function backfillFileCardsAudience(uid: string): Promise<number> {
  const db = getClientFirestore();
  const snap = await getDocs(collection(db, "fileCards"));
  const targets = snap.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    return data.audience === undefined || data.audience === null || data.audience === "";
  });
  if (targets.length === 0) return 0;
  const batch = writeBatch(db);
  for (const d of targets) {
    batch.update(d.ref, {
      audience: "wholesale",
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return targets.length;
}

export async function listAllFileCardsAdmin(): Promise<FileCard[]> {
  await syncAuthTokenForFirestore();
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
    audience: CatalogAudience;
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
    /** If omitted, no image is stored; the catalog shows a PDF-style placeholder. */
    thumbnailFile?: File | null;
    uid: string;
  },
  opts?: { onProgress?: UploadProgressHandler },
): Promise<string> {
  const on = opts?.onProgress;
  const db = getClientFirestore();
  const st = getClientStorage();
  const cardId = doc(collection(db, "fileCards")).id;
  const pdfPath = getPdfPathForAudience(input.audience, cardId);
  const thumbPath = getThumbnailPathForAudience(input.audience, cardId);
  const pdfRef = ref(st, pdfPath);
  const thumbRef = ref(st, thumbPath);
  try {
    if (input.thumbnailFile) {
      const thumbBlob = await fileToWebpBlob(input.thumbnailFile);
      await runResumableUpload(
        pdfRef,
        input.pdfFile,
        { contentType: "application/pdf" },
        (r) => on?.(r * 0.72),
      );
      await runResumableUpload(
        thumbRef,
        thumbBlob,
        { contentType: thumbBlob.type || "image/webp" },
        (r) => on?.(0.72 + r * 0.24),
      );
      on?.(0.96);
    } else {
      await runResumableUpload(
        pdfRef,
        input.pdfFile,
        { contentType: "application/pdf" },
        (r) => on?.(r * 0.92),
      );
      on?.(0.94);
    }
    const fileUrl = await getDownloadURL(pdfRef);
    let thumbnailUrl = "";
    let storedThumbPath = "";
    if (input.thumbnailFile) {
      thumbnailUrl = await getDownloadURL(thumbRef);
      storedThumbPath = thumbPath;
    }
    await setDoc(doc(db, "fileCards", cardId), {
      audience: input.audience,
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
      thumbnailPath: storedThumbPath,
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

/**
 * Moves PDF (and custom thumbnail if any) to the storage prefix for `newAudience`,
 * updates Firestore URLs/paths, then deletes old objects. No-op if audience unchanged.
 */
export async function migrateFileCardStorageAudience(
  cardId: string,
  newAudience: CatalogAudience,
  uid: string,
  opts?: { onProgress?: UploadProgressHandler },
): Promise<void> {
  const on = opts?.onProgress;
  const db = getClientFirestore();
  const st = getClientStorage();
  const snap = await getDoc(doc(db, "fileCards", cardId));
  if (!snap.exists()) {
    throw new Error("البطاقة غير موجودة.");
  }
  const data = snap.data() as Record<string, unknown>;
  const oldAudience = normalizeAudienceFromDoc(data.audience);
  if (oldAudience === newAudience) return;

  const oldPdfPath = String(data.filePath ?? "").trim();
  const fileUrl = String(data.fileUrl ?? "").trim();
  if (!oldPdfPath && !fileUrl) {
    throw new Error("لا يوجد مسار أو رابط لملف PDF.");
  }

  let pdfBlob: Blob;
  if (oldPdfPath) {
    const bytes = await getBytes(ref(st, oldPdfPath));
    pdfBlob = new Blob([bytes], { type: "application/pdf" });
  } else {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("تعذر قراءة ملف PDF الحالي.");
    pdfBlob = await res.blob();
  }

  const newPdfPath = getPdfPathForAudience(newAudience, cardId);
  const newPdfRef = ref(st, newPdfPath);
  await runResumableUpload(
    newPdfRef,
    pdfBlob,
    { contentType: "application/pdf" },
    (r) => on?.(r * 0.78),
  );
  const newFileUrl = await getDownloadURL(newPdfRef);
  on?.(0.8);

  const oldThumbPath = String(data.thumbnailPath ?? "").trim();
  let thumbnailPath = "";
  let thumbnailUrl = "";
  if (oldThumbPath) {
    try {
      const thumbBytes = await getBytes(ref(st, oldThumbPath));
      const thumbBlob = new Blob([thumbBytes], {
        type: "image/webp",
      });
      const newThumbPath = getThumbnailPathForAudience(newAudience, cardId);
      const newTRef = ref(st, newThumbPath);
      await runResumableUpload(
        newTRef,
        thumbBlob,
        { contentType: thumbBlob.type || "image/webp" },
        (r) => on?.(0.8 + r * 0.18),
      );
      thumbnailUrl = await getDownloadURL(newTRef);
      thumbnailPath = newThumbPath;
    } catch {
      thumbnailPath = "";
      thumbnailUrl = "";
      try {
        await deleteObject(ref(st, oldThumbPath));
      } catch {
        /* ignore */
      }
    }
  }

  await updateDoc(doc(db, "fileCards", cardId), {
    audience: newAudience,
    fileUrl: newFileUrl,
    filePath: newPdfPath,
    thumbnailUrl,
    thumbnailPath,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
    version: increment(1),
  });
  on?.(0.98);

  if (oldPdfPath && oldPdfPath !== newPdfPath) {
    try {
      await deleteObject(ref(st, oldPdfPath));
    } catch {
      /* ignore */
    }
  }
  if (
    oldThumbPath &&
    thumbnailPath &&
    oldThumbPath !== thumbnailPath
  ) {
    try {
      await deleteObject(ref(st, oldThumbPath));
    } catch {
      /* ignore */
    }
  }
  on?.(1);
}

export async function updateFileCardMeta(
  cardId: string,
  input: {
    audience: CatalogAudience;
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
  opts?: { onProgress?: UploadProgressHandler },
): Promise<void> {
  const db = getClientFirestore();
  const snap = await getDoc(doc(db, "fileCards", cardId));
  if (!snap.exists()) return;
  const prevAudience = normalizeAudienceFromDoc(
    (snap.data() as Record<string, unknown>).audience,
  );
  if (input.audience !== prevAudience) {
    await migrateFileCardStorageAudience(
      cardId,
      input.audience,
      input.uid,
      opts,
    );
  }
  await updateDoc(doc(db, "fileCards", cardId), {
    audience: input.audience,
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
  const snap = await getDoc(doc(db, "fileCards", cardId));
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, unknown>;
  const audience = normalizeAudienceFromDoc(data.audience);
  const existingPath = String(data.filePath ?? "").trim();
  const pdfPath =
    existingPath ||
    getPdfPathForAudience(audience, cardId);
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

/** Clears custom thumbnail; public catalog falls back to PDF preview / placeholder. */
export async function removeFileCardThumbnail(
  cardId: string,
  uid: string,
): Promise<void> {
  const db = getClientFirestore();
  const st = getClientStorage();
  const snap = await getDoc(doc(db, "fileCards", cardId));
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, unknown>;
  const tp = String(data.thumbnailPath ?? "");
  if (tp) {
    try {
      await deleteObject(ref(st, tp));
    } catch {
      /* ignore */
    }
  }
  await updateDoc(doc(db, "fileCards", cardId), {
    thumbnailUrl: "",
    thumbnailPath: "",
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
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
  const snap = await getDoc(doc(db, "fileCards", cardId));
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, unknown>;
  const audience = normalizeAudienceFromDoc(data.audience);
  const existingThumb = String(data.thumbnailPath ?? "").trim();
  const thumbPath =
    existingThumb || getThumbnailPathForAudience(audience, cardId);
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
  const catalogTextPath = String(data.catalogTextPath ?? "").trim();
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
  try {
    if (catalogTextPath) await deleteObject(ref(st, catalogTextPath));
  } catch {
    /* ignore */
  }
  await deleteDoc(doc(db, "fileCards", cardId));
}
