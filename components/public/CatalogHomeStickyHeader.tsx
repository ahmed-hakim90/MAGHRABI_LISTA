"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CatalogHomeSectionTabs,
  type CatalogHomeSection,
} from "@/components/public/CatalogHomeSection";
import {
  CatalogViewToggle,
  type CatalogViewMode,
} from "@/components/public/CatalogViewToggle";
import { CategoryFilterChips } from "@/components/public/CategoryFilterChips";
import { SearchBox } from "@/components/public/SearchBox";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { DEFAULT_SITE_HOME_TITLE } from "@/lib/constants/siteDefaults";

type Props = {
  appName: string;
  logoUrl?: string;
  homeTitle: string;
  primaryColor?: string;
  basePath: string;
  homeSection: CatalogHomeSection;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  catalogView: CatalogViewMode;
  onCatalogViewChange: (mode: CatalogViewMode) => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  showCategoryChips: boolean;
  showCatalogViewToggle?: boolean;
  showPriceListsTab?: boolean;
  showReelsTab?: boolean;
};

/** First visit: show an inline hint next to the install control. */
const PWA_HEADER_TIP_DONE_KEY = "maghrabi_lista_pwa_header_tip_done_v1";

const PWA_INSTALL_NATIVE_TITLE =
  "تثبيت التطبيق — يضيف أيقونة على الشاشة الرئيسية للوصول السريع";

const PWA_HEADER_TIP_TEXT =
  "هذا الزر يثبّت الموقع كتطبيق على جهازك: أيقونة على الشاشة الرئيسية وفتح أسرع دون البحث في المتصفح في كل مرة.";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

export function CatalogHomeStickyHeader({
  appName,
  logoUrl,
  homeTitle,
  primaryColor = "#1D4ED8",
  basePath,
  homeSection,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  catalogView,
  onCatalogViewChange,
  onSelectCategory,
  categories,
  selectedCategory,
  showCategoryChips,
  showCatalogViewToggle = true,
  showPriceListsTab = true,
  showReelsTab = true,
}: Props) {
  const { hideAsInstalled, busy, runInstall } = usePwaInstall();
  const [searchOpen, setSearchOpen] = useState(false);
  const [installTipOpen, setInstallTipOpen] = useState(false);
  const installTipWrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const [shellHeight, setShellHeight] = useState(0);
  const title = homeTitle.trim() || DEFAULT_SITE_HOME_TITLE;
  const showSearchField = searchOpen || searchValue.length > 0;
  const spacerHeight =
    shellHeight > 0 ? `${shellHeight}px` : "min(7.5rem, 22dvh)";

  const dismissInstallTip = useCallback(() => {
    setInstallTipOpen(false);
    try {
      window.localStorage.setItem(PWA_HEADER_TIP_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (hideAsInstalled) return;
    try {
      if (window.localStorage.getItem(PWA_HEADER_TIP_DONE_KEY) === "1") {
        return;
      }
    } catch {
      return;
    }
    const id = window.setTimeout(() => setInstallTipOpen(true), 500);
    return () => window.clearTimeout(id);
  }, [hideAsInstalled]);

  useEffect(() => {
    if (!installTipOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissInstallTip();
    };
    const onPointerDown = (e: PointerEvent) => {
      const root = installTipWrapRef.current;
      if (root && !root.contains(e.target as Node)) dismissInstallTip();
    };
    const autoClose = window.setTimeout(() => dismissInstallTip(), 12_000);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.clearTimeout(autoClose);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [installTipOpen, dismissInstallTip]);

  const focusSearchInput = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(
        "library-search",
      ) as HTMLInputElement | null;
      el?.focus();
    });
  }, []);

  useEffect(() => {
    if (searchOpen) focusSearchInput();
  }, [searchOpen, focusSearchInput]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const sync = () => setShellHeight(el.offsetHeight);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, []);

  const onSearchButtonClick = () => {
    setSearchOpen((o) => {
      const next = !o;
      if (next) focusSearchInput();
      return next;
    });
  };

  return (
    <>
      <header
        ref={shellRef}
        className="fixed inset-x-0 top-0 z-20 overflow-x-visible overflow-y-visible bg-white pt-[env(safe-area-inset-top,0px)] shadow-[0_4px_14px_-4px_rgb(15_23_42/0.12),0_2px_6px_-3px_rgb(15_23_42/0.08)]"
      >
        <div className="mx-auto w-full max-w-6xl space-y-2 overflow-x-visible px-4 py-2 sm:space-y-2.5 sm:px-4 sm:py-3">
          <div className="flex flex-row items-center gap-2 sm:gap-3" dir="rtl">
            {logoUrl ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:h-10 sm:w-10">
                <Image
                  src={logoUrl}
                  alt={appName}
                  fill
                  className="object-cover object-center scale-[1.2]"
                  sizes="40px"
                  priority
                />
              </div>
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-lg shadow-[var(--shadow-card)] sm:h-10 sm:w-10 sm:text-xl"
                aria-hidden
              >
                📚
              </div>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <h1
                className="truncate text-sm font-bold leading-tight tracking-tight sm:text-base"
                style={{ color: primaryColor }}
              >
                {title}
              </h1>
              {!hideAsInstalled ? (
                <div ref={installTipWrapRef} className="relative shrink-0">
                  {installTipOpen ? (
                    <div
                      id="pwa-install-header-tip"
                      role="tooltip"
                      dir="rtl"
                      className="absolute start-0 top-[calc(100%+0.35rem)] z-30 w-[min(18rem,calc(100dvw-2rem))] rounded-xl border border-border bg-white p-3 text-start shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="break-words text-xs leading-relaxed text-foreground sm:text-[13px]">
                          {PWA_HEADER_TIP_TEXT}
                        </p>
                        <button
                          type="button"
                          onClick={dismissInstallTip}
                          className="shrink-0 rounded-lg px-1.5 py-0.5 text-lg leading-none text-muted transition hover:bg-black/[0.06] hover:text-foreground"
                          aria-label="إغلاق التلميح"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      dismissInstallTip();
                      void runInstall();
                    }}
                    className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-lg p-1.5 text-foreground/80 transition hover:bg-black/[0.06] hover:text-foreground active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
                    aria-label="تحميل أو تثبيت التطبيق"
                    title={PWA_INSTALL_NATIVE_TITLE}
                    aria-describedby={
                      installTipOpen ? "pwa-install-header-tip" : undefined
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onSearchButtonClick}
              aria-expanded={showSearchField}
              aria-controls="catalog-home-search-panel"
              className={`inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-xl border bg-card px-3 py-2 text-foreground shadow-[var(--shadow-card)] transition hover:bg-surface active:scale-[0.98] ${
                showSearchField
                  ? "border-primary/35 ring-[3px] ring-primary/15"
                  : "border-border"
              }`}
              aria-label="بحث في الملفات"
              title="بحث"
            >
              <SearchIcon />
            </button>
          </div>

          <CatalogHomeSectionTabs
            basePath={basePath}
            active={homeSection}
            showPriceLists={showPriceListsTab}
            showReels={showReelsTab}
          />

          {showSearchField ? (
            <div id="catalog-home-search-panel">
              <SearchBox
                value={searchValue}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                className="mx-0 w-full max-w-none px-0 sm:px-0"
              />
            </div>
          ) : null}

          {showCatalogViewToggle ? (
          <div className="flex items-center gap-2" dir="rtl">
            {showCategoryChips && categories.length > 0 ? (
              <>
                <div className="min-w-0 flex-1">
                  <CategoryFilterChips
                    categories={categories}
                    selected={selectedCategory}
                    onSelect={onSelectCategory}
                  />
                </div>
                <div className="shrink-0">
                  <CatalogViewToggle
                    value={catalogView}
                    onChange={onCatalogViewChange}
                  />
                </div>
              </>
            ) : (
              <div className="flex w-full justify-end">
                <CatalogViewToggle
                  value={catalogView}
                  onChange={onCatalogViewChange}
                />
              </div>
            )}
          </div>
          ) : null}
        </div>
      </header>
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: spacerHeight }}
        suppressHydrationWarning
      />
    </>
  );
}
