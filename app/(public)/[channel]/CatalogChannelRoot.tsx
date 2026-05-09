"use client";

import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { CatalogChannelProvider } from "@/components/public/CatalogChannelContext";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";
import { WhatsAppFloatingButton } from "@/components/public/WhatsAppFloatingButton";
import {
  CHANNEL_TO_AUDIENCE,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";

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
      {children}
    </CatalogChannelProvider>
  );
}
