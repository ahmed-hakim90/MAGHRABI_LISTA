import { redirect } from "next/navigation";

type Props = { params: Promise<{ cardId: string }> };

/** Old `/file/:id` URLs and bookmarks resolve straight to the PDF stream. */
export default async function FileCardPage({ params }: Props) {
  const { cardId } = await params;
  redirect(`/file/${cardId}/pdf`);
}
