"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { CatalogHomeStickyHeader } from "@/components/public/CatalogHomeStickyHeader";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { ReelsGrid } from "@/components/reels/ReelsGrid";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import { useReels } from "@/hooks/useReels";
import { publicReelsFeedPath } from "@/lib/constants/catalogChannels";

export default function ChannelReelsPage() {
  const { audience, basePath } = useCatalogChannel();
  const router = useRouter();
  const { reels, loading, error } = useReels(audience);
  const online = useNavigatorOnline();
  const s = usePublicSiteSettings();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return reels;
    return reels.filter((r) => r.title.toLowerCase().includes(needle));
  }, [reels, q]);

  const hasData = reels.length > 0;
  const feedHref = publicReelsFeedPath(audience);

  useEffect(() => {
    if (!s.showReels) router.replace(basePath);
  }, [s.showReels, router, basePath]);

  if (!s.showReels) {
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
        homeSection="reels"
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="بحث في الفيديوهات…"
        catalogView="grid"
        onCatalogViewChange={() => {}}
        categories={[]}
        selectedCategory={null}
        onSelectCategory={() => {}}
        showCategoryChips={false}
        showCatalogViewToggle={false}
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
              <ReelsGrid
                reels={filtered}
                compact
                showHeading={false}
                viewAllHref={feedHref}
              />
            ) : (
              <p className="py-16 text-center text-[15px] text-muted">
                {reels.length === 0
                  ? "لا توجد فيديوهات منشورة حاليًا."
                  : "لا توجد فيديوهات مطابقة لبحثك."}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
