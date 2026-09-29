"use client";

import { useMemo, useState } from "react";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import {
  CatalogViewToggle,
  useCatalogView,
} from "@/components/public/CatalogViewToggle";
import { CategoryFilterChips } from "@/components/public/CategoryFilterChips";
import { FolderCard } from "@/components/public/FolderCard";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { useSiteSettings } from "@/components/public/PublicSiteSettingsProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFileCards } from "@/hooks/useFileCards";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import type {
  SerializableFileCard,
  SerializableFileFolder,
} from "@/lib/server/publicCatalogData";
import {
  reviveCatalogCard,
  reviveCatalogFolder,
} from "@/lib/utils/catalogRevive";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";
import { WholesaleAdBanner, WholesaleAdRail } from "./WholesaleAdRail";
import { WholesaleCatalogSkeleton } from "./WholesaleCatalogSkeleton";
import { WholesaleFooter } from "./WholesaleFooter";
import { WholesaleHeader } from "./WholesaleHeader";
import { WholesaleMasthead } from "./WholesaleMasthead";
import { WholesalePdfCard } from "./WholesalePdfCard";

const CATALOG_VISIBLE_BATCH = 40;
const GRID_PRIORITY_COUNT = 4;

/**
 * Fixed brand backdrop (brand manual §Digital Media wallpaper): the red
 * gradient field and emblem geometry stay constant while the page scrolls;
 * the catalog sheet covers it from below the masthead.
 */
function WholesaleBrandBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(168deg, #91050F 0%, #C1101C 46%, #ED1F26 100%)",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M160 900V500a300 300 0 0 1 600 0v400"
          stroke="white"
          strokeOpacity="0.07"
          strokeWidth="44"
        />
        <path
          d="M680 900V500a300 300 0 0 1 600 0v400"
          stroke="white"
          strokeOpacity="0.07"
          strokeWidth="44"
        />
      </svg>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function StateMessage({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white px-6 py-10 text-center">
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="text-[13px] text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function WholesaleCatalogHomeClient({
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
      cards: initialCards.map(reviveCatalogCard),
      folders: initialFolders.map(reviveCatalogFolder),
    }),
    [initialCards, initialFolders],
  );
  const {
    cards,
    folders,
    loading,
    error: clientError,
    stale,
    refetch,
  } = useFileCards(audience, initialData);
  const online = useNavigatorOnline();
  const site = useSiteSettings();
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
  const searchActive =
    debouncedQ.trim().length > 0 || category !== null;

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

  const groupedByFolder = useMemo(() => {
    const map = new Map<string, typeof visibleCards>();
    for (const c of visibleCards) {
      if (!c.folderId) continue;
      const arr = map.get(c.folderId) ?? [];
      arr.push(c);
      map.set(c.folderId, arr);
    }
    return map;
  }, [visibleCards]);
  const orderedFolders = useMemo(
    () => folders.filter((f) => groupedByFolder.has(f.id)),
    [folders, groupedByFolder],
  );
  const ungrouped = useMemo(
    () => visibleCards.filter((c) => !c.folderId),
    [visibleCards],
  );

  const clearFilters = () => {
    setSearchInput("");
    setCategory(null);
  };

  return (
    <div className="flex min-h-dvh flex-col touch-manipulation">
      <WholesaleBrandBackdrop />
      <OfflineCatalogBanner
        offline={!online && hasCatalogData}
        stale={stale && online && hasCatalogData}
      />
      <WholesaleHeader
        basePath={basePath}
        showPriceLists={site.showPriceLists}
        showReels={site.showReels}
      />
      <WholesaleMasthead />

      <main className="relative flex min-h-0 flex-1 flex-col bg-surface">
        <div className="mx-auto flex w-full max-w-[1320px] items-start gap-8 px-4 sm:px-6 lg:px-10">
          <div className="min-w-0 flex-1">
            {/* Catalog toolbar */}
          <div className="-mt-0 pt-6 sm:pt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1" dir="rtl">
                <label htmlFor="wholesale-search" className="sr-only">
                  بحث في القوائم والكتالوجات
                </label>
                <span
                  className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-muted"
                  aria-hidden
                >
                  <SearchIcon />
                </span>
                <input
                  id="wholesale-search"
                  type="search"
                  autoComplete="off"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ابحث باسم القائمة أو الكتالوج…"
                  className="h-[52px] w-full rounded-lg border border-border bg-white ps-11 pe-4 text-[14px] text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-brand-red/50 focus:ring-[3px] focus:ring-brand-red/15 sm:text-[15px]"
                />
              </div>
              <div className="flex shrink-0 items-center justify-end">
                <CatalogViewToggle
                  value={catalogView}
                  onChange={setCatalogView}
                />
              </div>
            </div>

            {!showSkeleton && categories.length > 1 ? (
              <div className="mt-3">
                <CategoryFilterChips
                  categories={categories}
                  selected={category}
                  onSelect={setCategory}
                />
              </div>
            ) : null}
          </div>

          {/* Content states */}
          <div className="pb-10 pt-5">
            {showSkeleton ? (
              <WholesaleCatalogSkeleton view={catalogView} />
            ) : error && !hasCatalogData ? (
              <StateMessage
                title="تعذر تحميل القوائم حالياً"
                description="تحقق من الاتصال ثم أعد المحاولة."
                action={
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-lg bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                  >
                    إعادة المحاولة
                  </button>
                }
              />
            ) : !hasCatalogData ? (
              <StateMessage
                title="لا توجد قوائم متاحة حالياً"
                description="تُضاف القوائم والكتالوجات الجديدة هنا فور صدورها."
              />
            ) : filtered.length === 0 && searchActive ? (
              <StateMessage
                title="لا توجد قوائم مطابقة لبحثك"
                action={
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border border-brand-red/40 px-5 py-2.5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                  >
                    مسح البحث
                  </button>
                }
              />
            ) : (
              <>
                {orderedFolders.length > 0 ? (
                  <section className="mb-8" aria-label="المجلدات">
                    <header className="mb-3 flex items-baseline gap-2 border-b border-border pb-2">
                      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                        المجلدات
                      </h2>
                      <span className="text-[13px] text-muted">
                        ملفات منظّمة حسب التصنيف
                      </span>
                    </header>
                    {catalogView === "list" ? (
                      <div className="overflow-hidden rounded-lg border border-border bg-white">
                        {orderedFolders.map((f) => (
                          <FolderCard
                            key={f.id}
                            folder={f}
                            fileCount={groupedByFolder.get(f.id)?.length ?? 0}
                            variant="list"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-[359px]:grid-cols-1 md:grid-cols-3 md:gap-4 xl:grid-cols-4 [&>*]:min-w-0">
                        {orderedFolders.map((f) => (
                          <FolderCard
                            key={f.id}
                            folder={f}
                            fileCount={groupedByFolder.get(f.id)?.length ?? 0}
                            variant="grid"
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {ungrouped.length > 0 || orderedFolders.length === 0 ? (
                  <section aria-label="القوائم المتاحة">
                    <header className="mb-3 flex items-baseline gap-2 border-b border-border pb-2">
                      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                        القوائم المتاحة
                      </h2>
                      <span className="text-[13px] text-muted">
                        {filtered.length.toLocaleString("ar")} قائمة
                      </span>
                    </header>
                    {catalogView === "list" ? (
                      <div className="overflow-hidden rounded-lg border border-border bg-white">
                        {visibleCards.map((c, index) => (
                          <WholesalePdfCard
                            key={c.id}
                            card={c}
                            variant="list"
                            imagePriority={index < GRID_PRIORITY_COUNT}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-[359px]:grid-cols-1 md:grid-cols-3 md:gap-4 xl:grid-cols-4 [&>*]:min-w-0">
                        {visibleCards.map((c, index) => (
                          <WholesalePdfCard
                            key={c.id}
                            card={c}
                            variant="grid"
                            imagePriority={index < GRID_PRIORITY_COUNT}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {hasMore ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
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
                      className="rounded-lg border border-brand-red/40 bg-white px-6 py-2.5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                    >
                      تحميل المزيد
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>

            <div className="pb-10">
              <WholesaleAdBanner />
            </div>
          </div>

          <div className="hidden lg:block">
            <WholesaleAdRail />
          </div>
        </div>
      </main>

      <WholesaleFooter
        basePath={basePath}
        showPriceLists={site.showPriceLists}
        showReels={site.showReels}
      />
    </div>
  );
}
