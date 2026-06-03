"use client";

import dynamic from "next/dynamic";
import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { CatalogChannelProvider } from "@/components/public/CatalogChannelContext";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";
import { PublicSiteSettingsProvider } from "@/components/public/PublicSiteSettingsProvider";
import { WhatsAppFloatingButton } from "@/components/public/WhatsAppFloatingButton";
import {
  CHANNEL_TO_AUDIENCE,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import { isCatalogChatEnabled } from "@/lib/constants/catalogChatEnabled";
import type { SerializableSiteSettings } from "@/lib/server/publicCatalogData";

const FloatingAiChat = dynamic(
  () =>
    import("@/components/public/FloatingAiChat").then((m) => m.FloatingAiChat),
  { ssr: false },
);

export function CatalogChannelRoot({
  channel,
  initialSettings,
  children,
}: {
  channel: CatalogChannelSegment;
  initialSettings: SerializableSiteSettings;
  children: React.ReactNode;
}) {
  const audience = CHANNEL_TO_AUDIENCE[channel];
  const basePath = `/${channel}`;
  return (
    <PublicSiteSettingsProvider initialSettings={initialSettings}>
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
    </PublicSiteSettingsProvider>
  );
}
