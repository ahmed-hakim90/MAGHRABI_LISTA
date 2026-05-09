import { notFound, redirect } from "next/navigation";
import {
  AUDIENCE_TO_CHANNEL,
  normalizeAudienceFromDoc,
} from "@/lib/constants/catalogChannels";
import { getAdminFirestore } from "@/lib/firebase/admin";

type Props = { params: Promise<{ cardId: string }> };

/** Legacy `/file/:id` → canonical channel view. */
export default async function LegacyFileCardPage({ params }: Props) {
  const { cardId } = await params;
  const db = getAdminFirestore();
  const snap = await db.collection("fileCards").doc(cardId).get();
  if (!snap.exists) notFound();
  const d = snap.data() as Record<string, unknown>;
  if (!d.isActive || d.folderIsActive === false) notFound();
  const aud = normalizeAudienceFromDoc(d.audience);
  const ch = AUDIENCE_TO_CHANNEL[aud];
  redirect(`/${ch}/file/${cardId}/view`);
}
