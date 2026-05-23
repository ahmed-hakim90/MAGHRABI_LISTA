import type { Timestamp } from "firebase/firestore";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";

export type VideoProvider = "youtube" | "facebook" | "drive" | "unknown";

/** `all` = يظهر في كل القنوات */
export type ReelAudience = CatalogAudience | "all";

export type CatalogReel = {
  id: string;
  title: string;
  sourceUrl: string;
  provider: VideoProvider;
  embedUrl: string;
  audience: ReelAudience;
  sortOrder: number;
  likeCount: number;
  isActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type CatalogReelPublic = {
  id: string;
  title: string;
  sourceUrl: string;
  provider: VideoProvider;
  embedUrl: string;
  audience: ReelAudience;
  sortOrder: number;
  likeCount: number;
};

export type CatalogReelInput = {
  title: string;
  sourceUrl: string;
  audience: ReelAudience;
  sortOrder?: number;
  isActive?: boolean;
};
