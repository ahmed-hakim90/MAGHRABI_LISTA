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
export async function buildFolderFilesContextForChat(
  folderId: string,
  routeAudience: CatalogAudience,
): Promise<string> {
  const id = folderId.trim();
  if (!id) return "";

  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection("fileCards")
      .where("folderId", "==", id)
      .limit(80)
      .get();

    type Row = { title: string; path: string };
    const rows: Row[] = [];
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
      });
    }

    if (rows.length === 0) return "";

    const lines = [
      "## Current folder — price list files (titles + open paths on this site)",
      "The user is browsing this folder in the catalog. There may be no PDF text unless a file block is attached.",
      "When suggesting a catalog, give **title + path** from the list below (copy the path exactly). Do not say only «open the catalog» without a path.",
      "",
      ...rows
        .slice(0, 45)
        .map((r) => `- **${r.title}** → \`${r.path}\``),
    ];
    return lines.join("\n");
  } catch {
    return "";
  }
}
