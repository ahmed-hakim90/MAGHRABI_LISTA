"use client";

import { useMemo, useState, useEffect } from "react";
import { FileGrid } from "@/components/public/FileGrid";
import { LogoHeader } from "@/components/public/LogoHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { SearchBox } from "@/components/public/SearchBox";
import { useFileCards } from "@/hooks/useFileCards";
import type { FileCard } from "@/lib/types/models";
import type { SiteSettings } from "@/lib/types/models";
import { getSiteSettings } from "@/lib/services/settings";

function matchesSearch(card: FileCard, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const blob = [card.title, card.description, card.category, ...card.tags]
    .join(" ")
    .toLowerCase();
  return blob.includes(n);
}

export default function HomePage() {
  const { cards, loading, error } = useFileCards();
  const [q, setQ] = useState("");
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    void getSiteSettings().then(setSettings);
  }, []);

  const filtered = useMemo(
    () => cards.filter((c) => matchesSearch(c, q)),
    [cards, q],
  );

  const s = settings ?? {
    appName: "Library",
    logoUrl: "",
    logoPath: "",
    homeTitle: "",
    homeSubtitle: "",
    primaryColor: "#2F3437",
    updatedAt: null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3]">
      <LogoHeader
        appName={s.appName}
        logoUrl={s.logoUrl}
        homeTitle={s.homeTitle}
        homeSubtitle={s.homeSubtitle}
      />
      <SearchBox value={q} onChange={setQ} />
      <div className="mt-8">
        {loading ? (
          <p className="py-20 text-center text-[#6B6B6B]">Loading library…</p>
        ) : error ? (
          <p className="py-20 text-center text-red-800">{error}</p>
        ) : (
          <FileGrid cards={filtered} />
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
