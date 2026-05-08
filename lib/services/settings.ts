"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase/client";
import type { SiteSettings } from "@/lib/types/models";
import { STORAGE_FOLDER } from "@/lib/utils/storagePaths";
import { fileToWebpBlob } from "@/lib/utils/imageWebp";

const SITE_DOC = "site";

function fromData(data: Record<string, unknown>): SiteSettings {
  return {
    appName: String(data.appName ?? "Library"),
    logoUrl: String(data.logoUrl ?? ""),
    logoPath: String(data.logoPath ?? ""),
    homeTitle: String(data.homeTitle ?? ""),
    homeSubtitle: String(data.homeSubtitle ?? ""),
    primaryColor: String(data.primaryColor ?? "#2F3437"),
    updatedAt: (data.updatedAt as SiteSettings["updatedAt"]) ?? null,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = getClientFirestore();
  const d = await getDoc(doc(db, "settings", SITE_DOC));
  if (!d.exists()) {
    return fromData({});
  }
  return fromData(d.data() as Record<string, unknown>);
}

export async function updateSiteSettings(
  input: {
    appName: string;
    homeTitle: string;
    homeSubtitle: string;
    primaryColor: string;
    logoFile?: File | null;
  },
  previous: SiteSettings,
): Promise<SiteSettings> {
  const db = getClientFirestore();
  const st = getClientStorage();
  let logoUrl = previous.logoUrl;
  let logoPath = previous.logoPath;

  if (input.logoFile) {
    const path = `${STORAGE_FOLDER}/site/logo.webp`;
    const logoRef = ref(st, path);
    const blob = await fileToWebpBlob(input.logoFile);
    await uploadBytes(logoRef, blob, {
      contentType: blob.type || "image/webp",
    });
    logoUrl = await getDownloadURL(logoRef);
    logoPath = path;
    if (previous.logoPath && previous.logoPath !== path) {
      try {
        await deleteObject(ref(st, previous.logoPath));
      } catch {
        /* ignore */
      }
    }
  }

  const next: Record<string, unknown> = {
    appName: input.appName.trim(),
    homeTitle: input.homeTitle.trim(),
    homeSubtitle: input.homeSubtitle.trim(),
    primaryColor: input.primaryColor.trim(),
    logoUrl,
    logoPath,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "settings", SITE_DOC), next, { merge: true });
  const merged = await getDoc(doc(db, "settings", SITE_DOC));
  return fromData((merged.data() ?? {}) as Record<string, unknown>);
}
