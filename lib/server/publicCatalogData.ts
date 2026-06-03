import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  normalizeAudienceFromDoc,
  type CatalogAudience,
} from "@/lib/constants/catalogChannels";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
  DEFAULT_SITE_PRIMARY_COLOR,
} from "@/lib/constants/siteDefaults";
import type { FileCard, FileFolder, SiteSettings } from "@/lib/types/models";
import { STORAGE_FOLDER } from "@/lib/utils/storagePaths";
import { parseWhatsappContactsRaw } from "@/lib/utils/siteWhatsappContacts";

export const PUBLIC_CATALOG_REVALIDATE_SECONDS = 300;

export type SerializableTimestamp = {
  ms: number;
} | null;

export type SerializableFileCard = Omit<
  FileCard,
  "createdAt" | "updatedAt"
> & {
  createdAt: SerializableTimestamp;
  updatedAt: SerializableTimestamp;
};

export type SerializableFileFolder = Omit<
  FileFolder,
  "createdAt" | "updatedAt"
> & {
  createdAt: SerializableTimestamp;
  updatedAt: SerializableTimestamp;
};

export type SerializableSiteSettings = Omit<SiteSettings, "updatedAt"> & {
  updatedAt: SerializableTimestamp;
};

export type PublicCatalogPayload = {
  cards: SerializableFileCard[];
  folders: SerializableFileFolder[];
  error: string | null;
};

function timestampToSerializable(value: unknown): SerializableTimestamp {
  const ms =
    typeof (value as { toMillis?: () => number } | null)?.toMillis ===
    "function"
      ? (value as { toMillis: () => number }).toMillis()
      : null;
  return ms != null && Number.isFinite(ms) ? { ms } : null;
}

function fileCardFromDoc(
  id: string,
  data: Record<string, unknown>,
): SerializableFileCard {
  const productCountRaw = data.productCount;
  const productCount =
    productCountRaw == null || productCountRaw === ""
      ? null
      : Number(productCountRaw);
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
      data.folderIsActive === undefined ? true : Boolean(data.folderIsActive),
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive),
    createdAt: timestampToSerializable(data.createdAt),
    updatedAt: timestampToSerializable(data.updatedAt),
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
    version: Number(data.version ?? 1),
    productCount:
      productCount != null && Number.isFinite(productCount) && productCount >= 0
        ? Math.floor(productCount)
        : null,
    viewCount: Number(data.viewCount ?? 0),
  };
}

function folderFromDoc(
  id: string,
  data: Record<string, unknown>,
): SerializableFileFolder {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive),
    createdAt: timestampToSerializable(data.createdAt),
    updatedAt: timestampToSerializable(data.updatedAt),
    createdBy: String(data.createdBy ?? ""),
    updatedBy: String(data.updatedBy ?? ""),
  };
}

export function settingsFromData(
  data: Record<string, unknown>,
): SerializableSiteSettings {
  return {
    appName: String(data.appName ?? "").trim() || DEFAULT_SITE_APP_NAME,
    logoUrl: String(data.logoUrl ?? ""),
    logoPath: String(data.logoPath ?? ""),
    homeTitle: String(data.homeTitle ?? "").trim() || DEFAULT_SITE_HOME_TITLE,
    homeSubtitle: String(data.homeSubtitle ?? ""),
    primaryColor: String(data.primaryColor ?? DEFAULT_SITE_PRIMARY_COLOR),
    whatsappContacts: parseWhatsappContactsRaw(data.whatsappContacts),
    priceListOrderIncludePrices: Boolean(
      data.priceListOrderIncludePrices ?? false,
    ),
    showPriceLists: Boolean(data.showPriceLists ?? true),
    showReels: Boolean(data.showReels ?? true),
    updatedAt: timestampToSerializable(data.updatedAt),
  };
}

async function loadPublicCatalog(audience: CatalogAudience): Promise<PublicCatalogPayload> {
  try {
    const db = getAdminFirestore();
    const cardsQuery = db
      .collection("fileCards")
      .where("isActive", "==", true)
      .where("folderIsActive", "==", true)
      .orderBy("order", "asc")
      .orderBy("updatedAt", "desc");
    const foldersQuery = db
      .collection("fileFolders")
      .where("isActive", "==", true)
      .orderBy("order", "asc");

    const [cardsSnap, foldersSnap] = await Promise.all([
      cardsQuery.get(),
      foldersQuery.get(),
    ]);

    const cards = cardsSnap.docs
      .map((d) => fileCardFromDoc(d.id, d.data()))
      .filter((card) => card.audience === audience);

    return {
      cards,
      folders: foldersSnap.docs.map((d) => folderFromDoc(d.id, d.data())),
      error: null,
    };
  } catch (e) {
    console.warn("[publicCatalogData] failed to load catalog", e);
    return {
      cards: [],
      folders: [],
      error: "تعذر تحميل الكتالوج الآن.",
    };
  }
}

export const getCachedPublicCatalog = unstable_cache(
  loadPublicCatalog,
  ["public-catalog"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-catalog"],
  },
);

async function loadPublicSiteSettings(): Promise<SerializableSiteSettings> {
  try {
    const db = getAdminFirestore();
    const settingsSnap = await db.collection("file_settings").doc("site").get();
    return settingsFromData(settingsSnap.data() ?? {});
  } catch (e) {
    console.warn("[publicCatalogData] failed to load site settings", e);
    return settingsFromData({});
  }
}

export const getCachedPublicSiteSettings = unstable_cache(
  loadPublicSiteSettings,
  ["public-site-settings"],
  {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-site-settings"],
  },
);
