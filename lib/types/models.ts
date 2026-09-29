import type { Timestamp } from "firebase/firestore";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";

export type FileCard = {
  id: string;
  /** Catalog channel: wholesale, retail, or no-price lists */
  audience: CatalogAudience;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  thumbnailPath: string;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: "pdf";
  storageFolder: string;
  /** Empty string means the card has no folder. */
  folderId: string;
  folderName: string;
  /** Denormalized so security rules can hide cards under inactive folders. */
  folderIsActive: boolean;
  order: number;
  isActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  updatedBy: string;
  version: number;
  /** Optional display count (e.g. SKU lines); null/omit if unknown */
  productCount: number | null;
  /** Server-incremented via POST /api/catalog/view */
  viewCount: number;
};


export type FileFolder = {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  updatedBy: string;
};

/** Public site WhatsApp destinations; `phoneDigits` is wa.me format (digits only, no +). */
export type WhatsAppContact = {
  id: string;
  displayName: string;
  phoneDigits: string;
};

export type SiteSettings = {
  appName: string;
  logoUrl: string;
  logoPath: string;
  homeTitle: string;
  homeSubtitle: string;
  primaryColor: string;
  whatsappContacts: WhatsAppContact[];
  /** Short code or digits for the public floating call button (`tel:` link). */
  hotlineNumber: string;
  /** When true, WhatsApp orders from price lists include line prices. */
  priceListOrderIncludePrices: boolean;
  /** Controls whether the interactive price lists tab/page is visible publicly. */
  showPriceLists: boolean;
  /** Controls whether the reels/videos tab/page is visible publicly. */
  showReels: boolean;
  /** Ad announcement shown in the wholesale rollup-style ad rail (empty = brand default). */
  adTitle: string;
  adSlogan: string;
  updatedAt: Timestamp | null;
};

export type NotificationDoc = {
  title: string;
  body: string;
  targetCardId: string | null;
  createdAt: Timestamp | null;
  createdBy: string;
  status: "draft" | "sent" | "failed";
};

/** One entry of the dynamic announcement ticker bar (file_settings/announcements). */
export type AnnouncementItem = {
  id: string;
  textAr: string;
  textEn: string;
  link: string;
  linkLabelAr: string;
  linkLabelEn: string;
  openInNewTab: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Epoch ms; null = no lower bound. */
  startAt: number | null;
  /** Epoch ms; null = no upper bound. */
  endAt: number | null;
  createdAt: number | null;
  updatedAt: number | null;
};
