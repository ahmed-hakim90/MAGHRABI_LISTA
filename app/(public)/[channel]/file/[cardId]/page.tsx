import { redirect } from "next/navigation";

type Props = { params: Promise<{ channel: string; cardId: string }> };

export default async function ChannelFileRedirectPage({ params }: Props) {
  const { channel, cardId } = await params;
  redirect(`/${channel}/file/${cardId}/view`);
}
