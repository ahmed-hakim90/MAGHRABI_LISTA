"use client";

import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { CatalogChannelProvider } from "@/components/public/CatalogChannelContext";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";
import { FloatingAiChat } from "@/components/public/FloatingAiChat";
import { WhatsAppFloatingButton } from "@/components/public/WhatsAppFloatingButton";
import {
  CHANNEL_TO_AUDIENCE,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import { isCatalogChatEnabled } from "@/lib/constants/catalogChatEnabled";

export function CatalogChannelRoot({
  channel,
  children,
}: {
  channel: CatalogChannelSegment;
  children: React.ReactNode;
}) {
  const audience = CHANNEL_TO_AUDIENCE[channel];
  const basePath = `/${channel}`;
  return (
    <CatalogChannelProvider value={{ audience, basePath }}>
      <NotificationPromptModal />
      <PwaInstallModal />
      <WhatsAppFloatingButton />
      {isCatalogChatEnabled() &&
      (channel === "wholesale" || channel === "retail") ? (
        <FloatingAiChat audience={channel} />
      ) : null}
      {children}
    </CatalogChannelProvider>
  );
}
