"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import { useCatalogView } from "@/components/public/CatalogViewToggle";
import { CatalogSearchBar } from "@/components/public/CatalogSearchBar";
import { FileGrid } from "@/components/public/FileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { LogoHeader } from "@/components/public/LogoHeader";
import { OfflineCatalogBanner } from "@/components/public/OfflineCatalogBanner";
import { useFileCards } from "@/hooks/useFileCards";
import { useNavigatorOnline } from "@/hooks/useNavigatorOnline";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

export default function ChannelFolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const { basePath, audience } = useCatalogChannel();
  const { cards, folders, loading, error, stale } = useFileCards(audience);
  const online = useNavigatorOnline();
  const s = usePublicSiteSettings();
  const [q, setQ] = useState("");
  const [catalogView, setCatalogView] = useCatalogView();

  const hasCatalogData = cards.length > 0 || folders.length > 0;

  const folder = useMemo(
    () => folders.find((f) => f.id === folderId),
    [folders, folderId],
  );

  const folderCards = useMemo(
    () =>
      cards.filter(
        (c) => c.folderId === folderId && matchesFileCardSearch(c, q),
      ),
    [cards, folderId, q],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <LoadingOverlay open={loading} />
      <OfflineCatalogBanner offline={!online && hasCatalogData} stale={stale && online && hasCatalogData} />
      <LogoHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        homeSubtitle={s.homeSubtitle}
        primaryColor={s.primaryColor}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-2">
        <Link
          href={basePath}
          className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← العودة للرئيسية
        </Link>
      </div>
      {loading ? (
        <main className="min-h-[min(12rem,40dvh)] flex-1" aria-hidden />
      ) : error && !hasCatalogData ? (
        <main className="flex flex-1 flex-col">
          <p className="flex-1 py-16 text-center text-red-800">{error}</p>
        </main>
      ) : !folder ? (
        <main className="flex flex-1 flex-col">
          <p className="flex-1 py-16 text-center text-muted">
            هذا المجلد غير متوفر.
          </p>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto max-w-6xl px-4 pb-4">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {folder.name}
            </h2>
            {folder.description ? (
              <p className="mt-1 text-sm text-muted">{folder.description}</p>
            ) : null}
          </div>
          <div className="mx-auto w-full max-w-6xl px-4 pt-1 sm:pt-2">
            <CatalogSearchBar
              searchValue={q}
              onSearchChange={setQ}
              catalogView={catalogView}
              onCatalogViewChange={setCatalogView}
            />
          </div>
          <div className="mt-4 flex min-h-0 flex-1 flex-col sm:mt-6">
            <FileGrid cards={folderCards} view={catalogView} />
          </div>
        </main>
      )}
    </div>
  );
}
