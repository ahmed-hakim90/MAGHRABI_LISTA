"use client";

import dynamic from "next/dynamic";
import { NotificationPromptModal } from "@/components/public/NotificationPromptModal";
import { CatalogChannelProvider } from "@/components/public/CatalogChannelContext";
import { PwaInstallModal } from "@/components/public/PwaInstallModal";
import { PublicSiteSettingsProvider } from "@/components/public/PublicSiteSettingsProvider";
import { FloatingContactButtons } from "@/components/public/FloatingContactButtons";
import { FloatingServiceCentersButton } from "@/components/public/FloatingServiceCentersButton";
import { AnnouncementBar } from "@/components/public/AnnouncementBar";
import {
  CHANNEL_TO_AUDIENCE,
  type CatalogChannelSegment,
} from "@/lib/constants/catalogChannels";
import { isCatalogChatEnabled } from "@/lib/constants/catalogChatEnabled";
import type { AnnouncementItem } from "@/lib/types/models";
import type { SerializableSiteSettings } from "@/lib/server/publicCatalogData";

const FloatingAiChat = dynamic(
  () =>
    import("@/components/public/FloatingAiChat").then((m) => m.FloatingAiChat),
  { ssr: false },
);

/** Channels that show the announcement ticker. Retail uses a fixed top header,
 *  so enabling it there needs its own layout pass first. */
const ANNOUNCEMENT_BAR_CHANNELS: ReadonlySet<CatalogChannelSegment> = new Set([
  "wholesale",
]);

export function CatalogChannelRoot({
  channel,
  initialSettings,
  announcements,
  children,
}: {
  channel: CatalogChannelSegment;
  initialSettings: SerializableSiteSettings;
  announcements: AnnouncementItem[];
  children: React.ReactNode;
}) {
  const audience = CHANNEL_TO_AUDIENCE[channel];
  const basePath = `/${channel}`;
  return (
    <PublicSiteSettingsProvider initialSettings={initialSettings}>
      <div
        className={
          channel === "wholesale" ? "contents channel-wholesale" : "contents"
        }
      >
        <CatalogChannelProvider value={{ audience, basePath }}>
          {ANNOUNCEMENT_BAR_CHANNELS.has(channel) ? (
            <AnnouncementBar items={announcements} />
          ) : null}
          {channel !== "wholesale" && <NotificationPromptModal />}
          <PwaInstallModal />
          <FloatingContactButtons />
          <FloatingServiceCentersButton />
          {isCatalogChatEnabled() &&
          (channel === "wholesale" || channel === "retail") ? (
            <FloatingAiChat audience={channel} />
          ) : null}
          {children}
        </CatalogChannelProvider>
      </div>
    </PublicSiteSettingsProvider>
  );
}
