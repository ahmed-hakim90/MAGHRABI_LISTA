import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { storagePrefixForAudience } from "@/lib/constants/catalogChannels";

export const STORAGE_FOLDER =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_FOLDER || "magrabi-lista";

/** PDF path for new uploads (audience-specific prefix). */
export function getPdfPathForAudience(
  audience: CatalogAudience,
  cardId: string,
): string {
  const seg = storagePrefixForAudience(audience);
  return `${STORAGE_FOLDER}/${seg}/files/${cardId}/document.pdf`;
}

/** Thumbnail path for new uploads (audience-specific prefix). */
export function getThumbnailPathForAudience(
  audience: CatalogAudience,
  cardId: string,
): string {
  const seg = storagePrefixForAudience(audience);
  return `${STORAGE_FOLDER}/${seg}/images/${cardId}/thumbnail.webp`;
}

/**
 * Server-only plain-text extract for AI chat (not publicly readable — see storage.rules).
 */
export function getChatIndexTextPathForAudience(
  audience: CatalogAudience,
  cardId: string,
): string {
  const seg = storagePrefixForAudience(audience);
  return `${STORAGE_FOLDER}/${seg}/chat-index/${cardId}.txt`;
}

/** @deprecated Prefer getPdfPathForAudience — kept for legacy paths in DB */
export function getPdfPath(cardId: string): string {
  return `${STORAGE_FOLDER}/files/${cardId}/document.pdf`;
}

/** @deprecated Prefer getThumbnailPathForAudience */
export function getThumbnailPath(cardId: string): string {
  return `${STORAGE_FOLDER}/images/${cardId}/thumbnail.webp`;
}
