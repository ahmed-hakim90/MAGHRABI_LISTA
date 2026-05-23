import type { Timestamp } from "firebase/firestore";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";

export type PriceList = {
  id: string;
  /** Catalog channel: wholesale, retail, or no_prices (lists). */
  audience: CatalogAudience;
  name: string;
  slug: string;
  pdfUrl: string;
  coverImage: string;
  /** Linked catalog PDF card; pdfUrl/coverImage are denormalized from it. */
  linkedFileCardId: string;
  isActive: boolean;
  lastImportReport?: PriceListLastImportReport | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type PriceListItem = {
  id: string;
  listId: string;
  sku: string;
  name: string;
  imageUrl: string;
  unit: string;
  cartonQty: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
  /** Denormalized from parent list for security rules. */
  listIsActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastImportedAt: Timestamp | null;
};

export type PriceListItemInput = {
  sku: string;
  name: string;
  imageUrl: string;
  unit: string;
  cartonQty: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
};

export type ExcelImportRow = {
  rowNumber: number;
  listId: string;
  listName: string;
  sku: string;
  name: string;
  imageUrl: string;
  unit: string;
  cartonQty: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
  pdfUrl: string;
};

export type ImportRowError = {
  rowNumber: number;
  sku: string;
  field?: string;
  message: string;
  severity: "error" | "warning" | "skipped";
};

export type PriceListLastImportReport = {
  importedAt: string;
  create: number;
  update: number;
  deactivate: number;
  skipped: number;
  warnings: number;
  errors: number;
  /** آخر 200 ملاحظة (تخطي / تحذير / خطأ) */
  issues: ImportRowError[];
};

export type ImportPreviewChange = {
  sku: string;
  name: string;
  action: "create" | "update" | "deactivate";
};

export type ImportPreviewResult = {
  listId: string;
  listName: string;
  pdfUrl: string | null;
  stats: {
    create: number;
    update: number;
    deactivate: number;
    errors: number;
    warnings: number;
    skipped: number;
  };
  changes: ImportPreviewChange[];
  errors: ImportRowError[];
  /** Serialized rows ready for commit (validated). */
  rows: ExcelImportRow[];
};

export type CartLine = {
  sku: string;
  name: string;
  cartonQty: number;
  price?: number;
  unit?: string;
};

/** Server-serializable price list for RSC. */
export type PriceListPublic = {
  id: string;
  audience: CatalogAudience;
  name: string;
  slug: string;
  pdfUrl: string;
  coverImage: string;
  linkedFileCardId?: string;
};

export type PriceListItemPublic = {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  unit: string;
  cartonQty: number;
  price: number;
  sortOrder: number;
};
