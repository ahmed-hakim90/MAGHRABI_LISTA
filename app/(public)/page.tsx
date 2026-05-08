"use client";

import { useMemo, useState, useEffect } from "react";
import { FolderedFileGrid } from "@/components/public/FolderedFileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { LogoHeader } from "@/components/public/LogoHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { SearchBox } from "@/components/public/SearchBox";
import { useFileCards } from "@/hooks/useFileCards";
import type { SiteSettings } from "@/lib/types/models";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
} from "@/lib/constants/siteDefaults";
import { getSiteSettings } from "@/lib/services/settings";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

export default function HomePage() {
  const { cards, folders, loading, error } = useFileCards();
  const [q, setQ] = useState("");
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    void getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const filtered = useMemo(
    () => cards.filter((c) => matchesFileCardSearch(c, q)),
    [cards, q],
  );

  const s = settings ?? {
    appName: DEFAULT_SITE_APP_NAME,
    logoUrl: "",
    logoPath: "",
    homeTitle: DEFAULT_SITE_HOME_TITLE,
    homeSubtitle: "",
    primaryColor: "#2F3437",
    updatedAt: null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3]">
      <LoadingOverlay open={loading} />
      <LogoHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        homeSubtitle={s.homeSubtitle}
        primaryColor={s.primaryColor}
      />
      <SearchBox value={q} onChange={setQ} />
      <div className="mt-8 min-h-[min(60vh,560px)]">
        {loading ? (
          <div className="min-h-[200px]" aria-hidden />
        ) : error ? (
          <p className="py-20 text-center text-red-800">{error}</p>
        ) : (
          <FolderedFileGrid cards={filtered} folders={folders} />
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
