"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { FileGrid } from "@/components/public/FileGrid";
import { LoadingOverlay } from "@/components/public/LoadingOverlay";
import { LogoHeader } from "@/components/public/LogoHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { SearchBox } from "@/components/public/SearchBox";
import { useFileCards } from "@/hooks/useFileCards";
import {
  DEFAULT_SITE_APP_NAME,
  DEFAULT_SITE_HOME_TITLE,
} from "@/lib/constants/siteDefaults";
import { getSiteSettings } from "@/lib/services/settings";
import type { SiteSettings } from "@/lib/types/models";
import { matchesFileCardSearch } from "@/lib/utils/fileCardSearch";

export default function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = use(params);
  const { cards, folders, loading, error } = useFileCards();
  const [q, setQ] = useState("");
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    void getSiteSettings().then(setSettings);
  }, []);

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

  const s = settings ?? {
    appName: DEFAULT_SITE_APP_NAME,
    logoUrl: "",
    logoPath: "",
    homeTitle: DEFAULT_SITE_HOME_TITLE,
    homeSubtitle: "",
    primaryColor: "#2F3437",
    updatedAt: null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3]">
      <LoadingOverlay open={loading} />
      <LogoHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        homeSubtitle={s.homeSubtitle}
        primaryColor={s.primaryColor}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-2">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-[#2F3437] underline-offset-4 hover:underline"
        >
          ← العودة للرئيسية
        </Link>
      </div>
      {loading ? (
        <div className="min-h-[200px]" aria-hidden />
      ) : error ? (
        <p className="py-20 text-center text-red-800">{error}</p>
      ) : !folder ? (
        <p className="py-20 text-center text-[#6B6B6B]">
          هذا المجلد غير متوفر.
        </p>
      ) : (
        <>
          <div className="mx-auto max-w-6xl px-4 pb-4">
            <h2 className="text-xl font-semibold text-[#2F3437] sm:text-2xl">
              {folder.name}
            </h2>
            {folder.description ? (
              <p className="mt-1 text-sm text-[#6B6B6B]">{folder.description}</p>
            ) : null}
          </div>
          <SearchBox value={q} onChange={setQ} />
          <div className="mt-8 min-h-[min(60vh,560px)]">
            <FileGrid cards={folderCards} />
          </div>
        </>
      )}
      <PublicFooter />
    </div>
  );
}
