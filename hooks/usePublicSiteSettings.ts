"use client";

import { useEffect, useLayoutEffect, useState } from "react";
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
  updatedAt: null,
};

export function usePublicSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(defaults);

  useLayoutEffect(() => {
    const local = readSettingsSnapshot();
    if (local) setSettings(local);
  }, []);

  useEffect(() => {
    void getSiteSettings()
      .then((s) => {
        setSettings(s);
        writeSettingsSnapshot(s);
      })
      .catch(() => {});
  }, []);

  return settings;
}
