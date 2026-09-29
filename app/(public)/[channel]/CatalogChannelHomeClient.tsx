"use client";

import { useMemo, useState } from "react";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { BrandGradient, BrandPattern, EmblemFrame } from "@/components/public/BrandSystem";
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
import { timestampFromMillis } from "@/lib/utils/clientTimestamp";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";
import {
  previewWholesaleCards,
  previewWholesaleFolders,
  shouldUsePreviewWholesaleCatalog,
} from "@/lib/dev/previewWholesaleCatalog";

const CATALOG_VISIBLE_BATCH = 40;

function reviveTimestamp(value: SerializableTimestamp) {
  return value ? timestampFromMillis(value.ms) : null;
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
      className="mx-auto grid w-full max-w-[1360px] grid-cols-2 gap-3 px-4 pb-safe-fab sm:grid-cols-3 sm:gap-5 sm:px-8 lg:grid-cols-4 lg:gap-6 lg:px-12"
      aria-label="تحميل الكتالوج"
    >
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden border border-[#eadfd2] bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-[#f4e9dc] via-white to-[#eadfd2] sm:aspect-[1.15/1]" />
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
  const previewCatalog =
    audience === "wholesale" &&
    shouldUsePreviewWholesaleCatalog() &&
    initialCards.length === 0 &&
    initialFolders.length === 0
      ? { cards: previewWholesaleCards, folders: previewWholesaleFolders }
      : null;
  const initialData = useMemo(
    () => ({
      cards: (previewCatalog?.cards ?? initialCards).map(reviveCard),
      folders: (previewCatalog?.folders ?? initialFolders).map(reviveFolder),
    }),
    [initialCards, initialFolders, previewCatalog],
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
  const error = clientError ?? (loading ? initialError : null);
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
        alwaysShowSearch={audience === "wholesale"}
      />
      {audience === "wholesale" ? (
        <BrandGradient className="relative isolate flex min-h-[17rem] items-center overflow-hidden px-4 py-8 text-white sm:min-h-[20rem] sm:px-10 sm:py-10" aria-labelledby="wholesale-hero-title">
          <BrandPattern />
          <div className="relative mx-auto grid max-w-6xl items-center gap-8 sm:grid-cols-[1fr_0.72fr] sm:gap-12">
            <div className="max-w-2xl" dir="rtl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-sm">EL MAGHRABY / WHOLESALE CATALOG</p>
              <h2 id="wholesale-hero-title" className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">كتالوج <span className="text-[#fff2e3]">الجملة</span></h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/85 sm:text-base">تصفح الأقسام والمنتجات المتاحة لشركاء المغربي.</p>
            </div>
            <EmblemFrame className="mx-auto aspect-[1.15] w-full max-w-sm border border-white/20 bg-[#fff2e3]/15 p-3 shadow-2xl sm:order-first">
              <div className="flex h-full items-center justify-center bg-[#fff2e3] p-5">
                <div className="flex h-full w-full items-center justify-center border border-[#ed1f26]/15 bg-white p-4">
                  <p className="text-center text-5xl font-bold tracking-tight text-[#ed1f26] sm:text-7xl">B2B</p>
                </div>
              </div>
            </EmblemFrame>
          </div>
        </BrandGradient>
      ) : null}
      <main id="catalog" className="mt-1 flex min-h-0 flex-1 flex-col bg-[#fff2e3] sm:mt-2">
        {showSkeleton ? (
          <CatalogSkeleton />
        ) : error && !hasCatalogData ? (
          <p className="flex-1 py-16 text-center text-red-800">{error}</p>
        ) : (
            <div className="mx-auto w-full max-w-[1360px] px-4 pb-8 pt-6 sm:px-8 sm:pb-12 sm:pt-8 lg:px-12">
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
