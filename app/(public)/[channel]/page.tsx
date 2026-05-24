"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { FolderedFileGrid } from "@/components/public/FolderedFileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFileCards } from "@/hooks/useFileCards";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

const CATALOG_VISIBLE_BATCH = 40;

export default function CatalogChannelHomePage() {
  const { audience, basePath } = useCatalogChannel();
  const { cards, folders, loading, error, stale } = useFileCards(audience);
  const online = useNavigatorOnline();
  const s = usePublicSiteSettings();
  const [searchInput, setSearchInput] = useState("");
  const debouncedQ = useDebouncedValue(searchInput, 300);
  const [category, setCategory] = useState<string | null>(null);
  const [catalogView, setCatalogView] = useCatalogView();
  const [visibleCount, setVisibleCount] = useState(CATALOG_VISIBLE_BATCH);

  const hasCatalogData = cards.length > 0 || folders.length > 0;

  useEffect(() => {
    setVisibleCount(CATALOG_VISIBLE_BATCH);
  }, [debouncedQ, category]);

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
          matchesFileCardSearch(c, debouncedQ) &&
          (category === null ||
            (c.category?.trim() || "عام") === category),
      ),
    [cards, debouncedQ, category],
  );

  const visibleCards = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex min-h-dvh flex-col bg-surface touch-manipulation">
      <LoadingOverlay open={loading} />
      <OfflineCatalogBanner offline={!online && hasCatalogData} stale={stale && online && hasCatalogData} />
      <CatalogHomeStickyHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        primaryColor={s.primaryColor}
        basePath={basePath}
        homeSection="catalog"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
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
          <div className="px-3 pb-6 sm:px-4">
            <FolderedFileGrid
              cards={visibleCards}
              folders={folders}
              view={catalogView}
            />
            {hasMore ? (
              <div className="mt-6 flex justify-center pb-safe-fab">
                <button
                  type="button"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
                  onClick={() =>
                    setVisibleCount((n) =>
                      Math.min(n + CATALOG_VISIBLE_BATCH, filtered.length),
                    )
                  }
                >
                  تحميل المزيد
                </button>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
