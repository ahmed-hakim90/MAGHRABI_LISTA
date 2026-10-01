"use client";

import { useMemo, useRef, useState } from "react";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
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
import { WholesaleCatalogSkeleton } from "./WholesaleCatalogSkeleton";
import { WholesaleCatalogToolbar } from "./WholesaleCatalogToolbar";
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

/** Arabic plural-aware list count: قائمة واحدة / قائمتان / N قوائم. */
function formatListsCount(count: number): string {
  if (count === 0) return "لا قوائم";
  if (count === 1) return "قائمة واحدة";
  if (count === 2) return "قائمتان";
  if (count <= 10) return `${count.toLocaleString("ar")} قوائم`;
  return `${count.toLocaleString("ar")} قائمة`;
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
    loading,
    error: clientError,
    stale,
    refetch,
  } = useFileCards(audience, initialData);
  const online = useNavigatorOnline();
  const site = useSiteSettings();
  const [searchInput, setSearchInput] = useState("");
  const debouncedQ = useDebouncedValue(searchInput, 300);
  const [catalogView, setCatalogView] = useCatalogView();
  const searchRef = useRef<HTMLInputElement>(null);

  // Clearing the input resets filtering instantly; the debounce only delays
  // typing, never the clear action.
  const effectiveQ = searchInput.trim() === "" ? "" : debouncedQ;
  const filterKey = effectiveQ;
  const [visibleState, setVisibleState] = useState({
    filterKey,
    count: CATALOG_VISIBLE_BATCH,
  });
  const visibleCount =
    visibleState.filterKey === filterKey
      ? visibleState.count
      : CATALOG_VISIBLE_BATCH;

  const hasCards = cards.length > 0;
  const error = clientError ?? (loading ? initialError : null);
  const showSkeleton = loading && !hasCards;

  const filtered = useMemo(
    () => cards.filter((c) => matchesFileCardSearch(c, effectiveQ)),
    [cards, effectiveQ],
  );

  const visibleCards = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;
  const searchActive = debouncedQ.trim() !== "";

  const clearSearch = () => {
    setSearchInput("");
    searchRef.current?.focus();
  };

  return (
    <div className="flex min-h-dvh flex-col touch-manipulation">
      <WholesaleBrandBackdrop />
      <OfflineCatalogBanner
        offline={!online && hasCards}
        stale={stale && online && hasCards}
      />
      <WholesaleHeader basePath={basePath} />
      <WholesaleMasthead />

      <main className="relative flex min-h-0 flex-1 flex-col bg-surface">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10">
          <WholesaleCatalogToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            inputRef={searchRef}
            view={catalogView}
            onViewChange={setCatalogView}
          />

          {/* Content states — pb clears the footer gap inside the sheet so the
              fixed brand backdrop never leaks through a transparent margin. */}
          <div className="pb-18 pt-3">
            {showSkeleton ? (
              <WholesaleCatalogSkeleton view={catalogView} />
            ) : error && !hasCards ? (
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
            ) : !hasCards ? (
              <StateMessage
                title="لا توجد قوائم متاحة حالياً"
                description="تُضاف القوائم الجديدة هنا فور صدورها."
              />
            ) : filtered.length === 0 && searchActive ? (
              <StateMessage
                title="لا توجد قوائم مطابقة لبحثك"
                action={
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-lg border border-brand-red/40 px-5 py-2.5 text-sm font-semibold text-brand-red transition hover:bg-brand-red/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                  >
                    مسح البحث
                  </button>
                }
              />
            ) : (
              <section aria-label="القوائم المتاحة">
                <header className="mb-2.5 flex items-baseline gap-2 border-b border-border pb-1.5">
                  <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    القوائم المتاحة
                  </h2>
                  <span className="text-[13px] text-muted">
                    {formatListsCount(filtered.length)}
                  </span>
                </header>
                {catalogView === "list" ? (
                  <div className="rounded-lg border border-border bg-white">
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
              </section>
            )}
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
