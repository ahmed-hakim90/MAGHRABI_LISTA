"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { FolderedFileGrid } from "@/components/public/FolderedFileGrid";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { useSiteSettings } from "@/components/public/PublicSiteSettingsProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFileCards } from "@/hooks/useFileCards";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import type {
  SerializableFileCard,
  SerializableFileFolder,
  SerializableTimestamp,
} from "@/lib/server/publicCatalogData";
import type { FileCard, FileFolder } from "@/lib/types/models";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

const CATALOG_VISIBLE_BATCH = 40;

function reviveTimestamp(value: SerializableTimestamp) {
  return value ? Timestamp.fromMillis(value.ms) : null;
}

function reviveCard(card: SerializableFileCard): FileCard {
  return {
    ...card,
    createdAt: reviveTimestamp(card.createdAt),
    updatedAt: reviveTimestamp(card.updatedAt),
  };
}

function reviveFolder(folder: SerializableFileFolder): FileFolder {
  return {
    ...folder,
    createdAt: reviveTimestamp(folder.createdAt),
    updatedAt: reviveTimestamp(folder.updatedAt),
  };
}

function CatalogSkeleton() {
  return (
    <div
      className="grid grid-cols-3 gap-2 px-safe pb-safe-fab sm:grid-cols-4 sm:gap-3 sm:px-4 lg:grid-cols-5"
      aria-label="تحميل الكتالوج"
    >
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
        >
          <div className="aspect-square animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-200" />
          <div className="space-y-1.5 border-t border-border/70 p-2">
            <div className="mx-auto h-3 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="mx-auto h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogChannelHomeClient({
  initialCards,
  initialFolders,
  initialError,
}: {
  initialCards: SerializableFileCard[];
  initialFolders: SerializableFileFolder[];
  initialError: string | null;
}) {
  const { audience, basePath } = useCatalogChannel();
  const initialData = useMemo(
    () => ({
      cards: initialCards.map(reviveCard),
      folders: initialFolders.map(reviveFolder),
    }),
    [initialCards, initialFolders],
  );
  const {
    cards,
    folders,
    loading,
    error: clientError,
    stale,
  } = useFileCards(audience, initialData);
  const online = useNavigatorOnline();
  const hydratedSettings = useSiteSettings();
  const [searchInput, setSearchInput] = useState("");
  const debouncedQ = useDebouncedValue(searchInput, 300);
  const [category, setCategory] = useState<string | null>(null);
  const [catalogView, setCatalogView] = useCatalogView();
  const filterKey = `${debouncedQ}\n${category ?? ""}`;
  const [visibleState, setVisibleState] = useState({
    filterKey,
    count: CATALOG_VISIBLE_BATCH,
  });
  const visibleCount =
    visibleState.filterKey === filterKey
      ? visibleState.count
      : CATALOG_VISIBLE_BATCH;

  const hasCatalogData = cards.length > 0 || folders.length > 0;
  const error = clientError ?? initialError;
  const showSkeleton = loading && !hasCatalogData;

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
          (category === null || (c.category?.trim() || "عام") === category),
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
      <OfflineCatalogBanner
        offline={!online && hasCatalogData}
        stale={stale && online && hasCatalogData}
      />
      <CatalogHomeStickyHeader
        appName={hydratedSettings.appName}
        logoUrl={hydratedSettings.logoUrl}
        homeTitle={hydratedSettings.homeTitle}
        primaryColor={hydratedSettings.primaryColor}
        basePath={basePath}
        homeSection="catalog"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        catalogView={catalogView}
        onCatalogViewChange={setCatalogView}
        categories={categories}
        selectedCategory={category}
        onSelectCategory={setCategory}
        showCategoryChips={!showSkeleton && (!error || hasCatalogData)}
        showPriceListsTab={hydratedSettings.showPriceLists}
        showReelsTab={hydratedSettings.showReels}
      />
      <main className="mt-1 flex min-h-0 flex-1 flex-col sm:mt-2">
        {showSkeleton ? (
          <CatalogSkeleton />
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
                    setVisibleState((prev) => {
                      const current =
                        prev.filterKey === filterKey
                          ? prev.count
                          : CATALOG_VISIBLE_BATCH;
                      return {
                        filterKey,
                        count: Math.min(
                          current + CATALOG_VISIBLE_BATCH,
                          filtered.length,
                        ),
                      };
                    })
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
