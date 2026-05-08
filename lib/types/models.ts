import type { Timestamp } from "firebase/firestore";

export type FileCard = {
  id: string;
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

export type SiteSettings = {
  appName: string;
  logoUrl: string;
  logoPath: string;
  homeTitle: string;
  homeSubtitle: string;
  primaryColor: string;
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
