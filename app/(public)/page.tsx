"use client";

import { useMemo, useState, useEffect } from "react";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { CatalogSearchBar } from "@/components/public/CatalogSearchBar";
import { FolderedFileGrid } from "@/components/public/FolderedFileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { LogoHeader } from "@/components/public/LogoHeader";
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
  const [catalogView, setCatalogView] = useCatalogView();

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
    <div className="flex min-h-dvh flex-col bg-surface touch-manipulation">
      <LoadingOverlay open={loading} />
      <LogoHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        homeSubtitle={s.homeSubtitle}
        primaryColor={s.primaryColor}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-1 sm:pt-2">
        <CatalogSearchBar
          searchValue={q}
          onSearchChange={setQ}
          catalogView={catalogView}
          onCatalogViewChange={setCatalogView}
        />
      </div>
      <main className="mt-4 flex min-h-0 flex-1 flex-col sm:mt-6">
        {loading ? (
          <div className="min-h-[min(12rem,40dvh)] flex-1" aria-hidden />
        ) : error ? (
          <p className="flex-1 py-16 text-center text-red-800">{error}</p>
        ) : (
          <FolderedFileGrid
            cards={filtered}
            folders={folders}
            view={catalogView}
          />
        )}
      </main>
    </div>
  );
}
