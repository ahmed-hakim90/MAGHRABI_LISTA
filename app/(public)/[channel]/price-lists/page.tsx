"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { PriceListGrid } from "@/components/public/PriceListCard";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import { usePriceLists } from "@/hooks/usePriceLists";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";

export default function ChannelPriceListsPage() {
  const { audience, basePath } = useCatalogChannel();
  const router = useRouter();
  const { lists, loading, error } = usePriceLists(audience);
  const online = useNavigatorOnline();
  const s = usePublicSiteSettings();
  const [q, setQ] = useState("");
  const [catalogView, setCatalogView] = useCatalogView();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(needle));
  }, [lists, q]);

  const hasData = lists.length > 0;

  useEffect(() => {
    if (!s.showPriceLists) router.replace(basePath);
  }, [s.showPriceLists, router, basePath]);

  if (!s.showPriceLists) {
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface touch-manipulation">
      <LoadingOverlay open={loading} />
      <OfflineCatalogBanner offline={!online && hasData} stale={false} />
      <CatalogHomeStickyHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        primaryColor={s.primaryColor}
        basePath={basePath}
        homeSection="price-lists"
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="بحث في القوائم التفاعلية…"
        catalogView={catalogView}
        onCatalogViewChange={setCatalogView}
        categories={[]}
        selectedCategory={null}
        onSelectCategory={() => {}}
        showCategoryChips={false}
        showPriceListsTab={s.showPriceLists}
        showReelsTab={s.showReels}
      />
      <main className="mt-1 flex min-h-0 flex-1 flex-col sm:mt-2">
        {loading ? (
          <div className="min-h-[min(12rem,40dvh)] flex-1" aria-hidden />
        ) : error && !hasData ? (
          <p className="flex-1 py-16 text-center text-red-800">{error}</p>
        ) : (
          <div className="px-3 pb-6 sm:px-4">
            {filtered.length > 0 ? (
              <PriceListGrid
                lists={filtered}
                variant={catalogView}
                showHeading={false}
              />
            ) : (
              <p className="py-16 text-center text-[15px] text-muted">
                {lists.length === 0
                  ? "لا توجد قوائم تفاعلية منشورة حاليًا."
                  : "لا توجد قوائم مطابقة لبحثك."}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
