"use client";

import { Timestamp } from "firebase/firestore";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import type { SerializableSiteSettings } from "@/lib/server/publicCatalogData";
import type { SiteSettings } from "@/lib/types/models";
import { resolveSiteHotlineNumber } from "@/lib/utils/hotlineNumber";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function reviveSiteSettings(
  settings: SerializableSiteSettings,
): SiteSettings {
  return {
    ...settings,
    hotlineNumber: resolveSiteHotlineNumber(settings.hotlineNumber),
    updatedAt: settings.updatedAt
      ? Timestamp.fromMillis(settings.updatedAt.ms)
      : null,
  };
}

export function PublicSiteSettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: SerializableSiteSettings;
  children: ReactNode;
}) {
  const revivedInitial = useMemo(
    () => reviveSiteSettings(initialSettings),
    [initialSettings],
  );
  const settings = usePublicSiteSettings(revivedInitial);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) {
    throw new Error(
      "useSiteSettings must be used within PublicSiteSettingsProvider",
    );
  }
  return settings;
}
