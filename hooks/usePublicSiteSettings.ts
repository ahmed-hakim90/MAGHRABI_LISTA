"use client";

import { useEffect, useState } from "react";
import {
  readSettingsSnapshot,
  writeSettingsSnapshot,
} from "@/lib/offline/settingsSnapshot";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
  DEFAULT_SITE_PRIMARY_COLOR,
} from "@/lib/constants/siteDefaults";
import { getSiteSettings } from "@/lib/services/settings";
import type { SiteSettings } from "@/lib/types/models";
const defaults: SiteSettings = {
  appName: DEFAULT_SITE_APP_NAME,
  logoUrl: "",
  logoPath: "",
  homeTitle: DEFAULT_SITE_HOME_TITLE,
  homeSubtitle: "",
  primaryColor: DEFAULT_SITE_PRIMARY_COLOR,
  whatsappContacts: [],
  priceListOrderIncludePrices: false,
  showPriceLists: true,
  showReels: true,
  updatedAt: null,
};

export function usePublicSiteSettings(initial?: SiteSettings): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(
    () => initial ?? readSettingsSnapshot() ?? defaults,
  );

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      void getSiteSettings()
        .then((s) => {
          if (cancelled) return;
          setSettings(s);
          writeSettingsSnapshot(s);
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return settings;
}
