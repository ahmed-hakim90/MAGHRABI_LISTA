import "server-only";

import {
  type CatalogAudience,
  normalizeAudienceFromDoc,
  publicCatalogFileViewPath,
} from "@/lib/constants/catalogChannels";
import { getAdminFirestore } from "@/lib/firebase/admin";

/**
 * When the visitor is on /{wholesale|retail}/folder/{id} (not inside a file view),
 * inject visible file titles so the model can answer «أنهي كتالوج؟» without PDF text.
 */
export type FolderCatalogFileRow = { title: string; path: string; tags: string[] };

function tagsFromFirestore(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.replace(/[\r\n]+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * Active file cards in a folder (for chat / folder UI). Sorted by Firestore doc order.
 */
export async function listFolderCatalogFilesForChat(
  folderId: string,
  routeAudience: CatalogAudience,
): Promise<FolderCatalogFileRow[]> {
  const id = folderId.trim();
  if (!id) return [];

  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection("fileCards")
      .where("folderId", "==", id)
      .limit(80)
      .get();

    const rows: FolderCatalogFileRow[] = [];
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (data.isActive === false || data.folderIsActive === false) continue;
      const aud = normalizeAudienceFromDoc(data.audience);
      if (aud !== routeAudience) continue;
      const title = String(data.title ?? "").replace(/[\r\n]+/g, " ").trim();
      if (!title) continue;
      rows.push({
        title,
        path: publicCatalogFileViewPath(routeAudience, doc.id),
        tags: tagsFromFirestore(data.tags),
      });
    }
    return rows;
  } catch {
    return [];
  }
}

export async function buildFolderFilesContextForChat(
  folderId: string,
  routeAudience: CatalogAudience,
): Promise<string> {
  const rows = await listFolderCatalogFilesForChat(folderId, routeAudience);
  if (rows.length === 0) return "";

  const lines = [
    "## Current folder — price list files (titles + open paths on this site)",
    "The user is browsing this folder in the catalog. There may be no PDF text unless a file block is attached.",
    "When suggesting a catalog, give **title + path** from the list below (copy the path exactly). Do not say only «open the catalog» without a path.",
    "",
    ...rows
      .slice(0, 45)
      .map((r) => {
        const tags = r.tags.length > 0 ? ` — tags: ${r.tags.join(", ")}` : "";
        return `- **${r.title}** → \`${r.path}\`${tags}`;
      }),
  ];
  return lines.join("\n");
}
