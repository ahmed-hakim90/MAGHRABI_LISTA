"use client";

import { useMemo, useState } from "react";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { FolderedFileGrid } from "@/components/public/FolderedFileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { useFileCards } from "@/hooks/useFileCards";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

export default function HomePage() {
  const { cards, folders, loading, error, stale } = useFileCards();
  const online = useNavigatorOnline();
  const s = usePublicSiteSettings();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [catalogView, setCatalogView] = useCatalogView();

  const hasCatalogData = cards.length > 0 || folders.length > 0;
  const showOfflineBanner =
    hasCatalogData && (!online || (stale && online));

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

  return (
    <div className="flex min-h-dvh flex-col bg-surface touch-manipulation">
      <LoadingOverlay open={loading} />
      <OfflineCatalogBanner offline={!online && hasCatalogData} stale={stale && online && hasCatalogData} />
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
        showCategoryChips={!loading && (!error || hasCatalogData)}
      />
      <main className="mt-1 flex min-h-0 flex-1 flex-col sm:mt-2">
        {loading ? (
          <div className="min-h-[min(12rem,40dvh)] flex-1" aria-hidden />
        ) : error && !hasCatalogData ? (
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
