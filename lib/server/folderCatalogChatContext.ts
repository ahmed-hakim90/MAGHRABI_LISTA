import "server-only";

import {
  type CatalogAudience,
  normalizeAudienceFromDoc,
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

    const titles: string[] = [];
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      if (data.isActive === false || data.folderIsActive === false) continue;
      const aud = normalizeAudienceFromDoc(data.audience);
      if (aud !== routeAudience) continue;
      const title = String(data.title ?? "").replace(/[\r\n]+/g, " ").trim();
      if (title) titles.push(title);
    }

    if (titles.length === 0) return "";

    const lines = [
      "## Current folder — price list files (titles only, from site)",
      "The user is browsing this folder in the catalog (grid/list of files). There is no PDF text in this request unless a separate file block is attached.",
      "If they ask which catalog / which file / what is available, answer using these titles in short Egyptian Arabic; suggest opening the relevant file for prices.",
      "",
      ...titles.slice(0, 45).map((t) => `- ${t}`),
    ];
    return lines.join("\n");
  } catch {
    return "";
  }
}
