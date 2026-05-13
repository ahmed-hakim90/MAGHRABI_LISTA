"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileTable } from "@/components/admin/FileTable";
import type { FileCard } from "@/lib/types/models";
import { listAllFileCardsAdmin } from "@/lib/services/fileCards";
import { useEffect } from "react";

type Audience = "wholesale" | "retail" | "no_prices";

const TABS: { value: Audience; label: string }[] = [
  { value: "wholesale", label: "جملة" },
  { value: "retail", label: "تجزئة" },
  { value: "no_prices", label: "بدون أسعار" },
];

export default function AdminFilesPage() {
  const [selectedTab, setSelectedTab] = useState<Audience>("wholesale");
  const [allCards, setAllCards] = useState<FileCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cards = await listAllFileCardsAdmin();
        setAllCards(cards);
      } catch (err) {
        console.error("Error loading cards:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    return {
      wholesale: allCards.filter((c) => c.audience === "wholesale").length,
      retail: allCards.filter((c) => c.audience === "retail").length,
      no_prices: allCards.filter((c) => c.audience === "no_prices").length,
    };
  }, [allCards]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground">الملفات</h1>
        <Link
          href="/admin/files/new"
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          ملف جديد
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium  transition-colors border-b-2 ${
              selectedTab === tab.value
                ? "border-primary text-white bg-blue-500 rounded-tl-lg rounded-tr-lg"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label} <span className="text-xs text-white">({counts[tab.value]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">جاري تحميل الملفات…</p>
      ) : (
        <FileTable audience={selectedTab} />
      )}
    </div>
  );
}
