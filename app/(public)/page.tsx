"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { FolderedFileGrid } from "@/components/public/FolderedFileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { useFileCards } from "@/hooks/useFileCards";
import type { SiteSettings } from "@/lib/types/models";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
  DEFAULT_SITE_PRIMARY_COLOR,
} from "@/lib/constants/siteDefaults";
import { getSiteSettings } from "@/lib/services/settings";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

export default function HomePage() {
  const { cards, folders, loading, error } = useFileCards();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [catalogView, setCatalogView] = useCatalogView();

  useEffect(() => {
    void getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards) {
      set.add(c.category?.trim() || "عام");
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [cards]);

  const filtered = useMemo(
    () =>
      cards.filter(
        (c) =>
          matchesFileCardSearch(c, q) &&
          (category === null ||
            (c.category?.trim() || "عام") === category),
      ),
    [cards, q, category],
  );

  const s = settings ?? {
    appName: DEFAULT_SITE_APP_NAME,
    logoUrl: "",
    logoPath: "",
    homeTitle: DEFAULT_SITE_HOME_TITLE,
    homeSubtitle: "",
    primaryColor: DEFAULT_SITE_PRIMARY_COLOR,
    updatedAt: null,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface touch-manipulation">
      <LoadingOverlay open={loading} />
      <CatalogHomeStickyHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        primaryColor={s.primaryColor}
        searchValue={q}
        onSearchChange={setQ}
        catalogView={catalogView}
        onCatalogViewChange={setCatalogView}
        categories={categories}
        selectedCategory={category}
        onSelectCategory={setCategory}
        showCategoryChips={!loading && !error}
      />
      <main className="mt-1 flex min-h-0 flex-1 flex-col sm:mt-2">
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
