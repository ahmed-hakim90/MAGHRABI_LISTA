import type {
  SerializableFileCard,
  SerializableFileFolder,
  SerializableTimestamp,
} from "@/lib/server/publicCatalogData";
import type { FileCard, FileFolder } from "@/lib/types/models";
import { timestampFromMillis } from "@/lib/utils/clientTimestamp";

function reviveTimestamp(value: SerializableTimestamp) {
  return value ? timestampFromMillis(value.ms) : null;
}

export function reviveCatalogCard(card: SerializableFileCard): FileCard {
  return {
    ...card,
    createdAt: reviveTimestamp(card.createdAt),
    updatedAt: reviveTimestamp(card.updatedAt),
  };
}

export function reviveCatalogFolder(
  folder: SerializableFileFolder,
): FileFolder {
  return {
    ...folder,
    createdAt: reviveTimestamp(folder.createdAt),
    updatedAt: reviveTimestamp(folder.updatedAt),
  };
}
