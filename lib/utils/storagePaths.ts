export const STORAGE_FOLDER =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_FOLDER || "magrabi-lista";

export function getPdfPath(cardId: string): string {
  return `${STORAGE_FOLDER}/files/${cardId}/document.pdf`;
}

export function getThumbnailPath(cardId: string): string {
  return `${STORAGE_FOLDER}/images/${cardId}/thumbnail.webp`;
}
