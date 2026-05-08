import { notFound } from "next/navigation";
import { CatalogPdfViewer } from "@/components/public/CatalogPdfViewer";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ cardId: string }> };

export default async function FileCardViewPage({ params }: Props) {
  const { cardId } = await params;
  const db = getAdminFirestore();
  const snap = await db.collection("fileCards").doc(cardId).get();
  if (!snap.exists) notFound();
  const data = snap.data() as {
    title?: string;
    isActive?: boolean;
    folderIsActive?: boolean;
  };
  if (!data.isActive || data.folderIsActive === false) notFound();
  const title =
    (data.title || cardId).replace(/[\r\n]+/g, " ").trim() || cardId;
  return <CatalogPdfViewer cardId={cardId} title={title} />;
}
