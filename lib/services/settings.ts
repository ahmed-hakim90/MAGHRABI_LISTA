"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { getClientFirestore, getClientStorage } from "@/lib/firebase/client";
import { runResumableUpload } from "@/lib/firebase/storageUpload";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
  DEFAULT_SITE_PRIMARY_COLOR,
} from "@/lib/constants/siteDefaults";
import type { SiteSettings, WhatsAppContact } from "@/lib/types/models";
import { STORAGE_FOLDER } from "@/lib/utils/storagePaths";
import { fileToWebpBlob } from "@/lib/utils/imageWebp";
import {
  normalizeWhatsappContactsForSave,
  parseWhatsappContactsRaw,
} from "@/lib/utils/siteWhatsappContacts";

const SITE_DOC = "site";

function fromData(data: Record<string, unknown>): SiteSettings {
  const appName = String(data.appName ?? "").trim() || DEFAULT_SITE_APP_NAME;
  const homeTitle =
    String(data.homeTitle ?? "").trim() || DEFAULT_SITE_HOME_TITLE;
  const whatsappContacts = parseWhatsappContactsRaw(data.whatsappContacts);
  return {
    appName,
    logoUrl: String(data.logoUrl ?? ""),
    logoPath: String(data.logoPath ?? ""),
    homeTitle,
    homeSubtitle: String(data.homeSubtitle ?? ""),
    primaryColor: String(data.primaryColor ?? DEFAULT_SITE_PRIMARY_COLOR),
    whatsappContacts,
    priceListOrderIncludePrices: Boolean(data.priceListOrderIncludePrices ?? false),
    showPriceLists: Boolean(data.showPriceLists ?? true),
    showReels: Boolean(data.showReels ?? true),
    updatedAt: (data.updatedAt as SiteSettings["updatedAt"]) ?? null,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = getClientFirestore();
  const d = await getDoc(doc(db, "file_settings", SITE_DOC));
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
    whatsappContacts: WhatsAppContact[];
    priceListOrderIncludePrices: boolean;
    showPriceLists: boolean;
    showReels: boolean;
    logoFile?: File | null;
  },
  previous: SiteSettings,
  opts?: { onUploadProgress?: (ratio01: number) => void },
): Promise<SiteSettings> {
  const db = getClientFirestore();
  const st = getClientStorage();
  let logoUrl = previous.logoUrl;
  let logoPath = previous.logoPath;

  // Persist text fields first so a logo Storage failure does not block saving copy/colors.
  const whatsappContacts = normalizeWhatsappContactsForSave(
    input.whatsappContacts,
  );

  await setDoc(
    doc(db, "file_settings", SITE_DOC),
    {
      appName: input.appName.trim(),
      homeTitle: input.homeTitle.trim(),
      homeSubtitle: input.homeSubtitle.trim(),
      primaryColor: input.primaryColor.trim(),
      whatsappContacts,
      priceListOrderIncludePrices: Boolean(input.priceListOrderIncludePrices),
      showPriceLists: Boolean(input.showPriceLists),
      showReels: Boolean(input.showReels),
      logoUrl,
      logoPath,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (input.logoFile) {
    const path = `${STORAGE_FOLDER}/site/logo.webp`;
    const logoRef = ref(st, path);
    const blob = await fileToWebpBlob(input.logoFile);
    await runResumableUpload(
      logoRef,
      blob,
      { contentType: blob.type || "image/webp" },
      opts?.onUploadProgress,
    );
    logoUrl = await getDownloadURL(logoRef);
    logoPath = path;
    if (previous.logoPath && previous.logoPath !== path) {
      try {
        await deleteObject(ref(st, previous.logoPath));
      } catch {
        /* ignore */
      }
    }
    await setDoc(
      doc(db, "file_settings", SITE_DOC),
      {
        logoUrl,
        logoPath,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  const merged = await getDoc(doc(db, "file_settings", SITE_DOC));
  return fromData((merged.data() ?? {}) as Record<string, unknown>);
}
