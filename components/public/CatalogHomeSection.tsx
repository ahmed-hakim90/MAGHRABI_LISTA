"use client";

import Link from "next/link";

export type CatalogHomeSection = "catalog" | "price-lists" | "reels";

type Props = {
  basePath: string;
  active: CatalogHomeSection;
  showPriceLists?: boolean;
  showReels?: boolean;
};

const tabs: {
  id: CatalogHomeSection;
  label: string;
  href: (base: string) => string;
}[] = [
  { id: "catalog", label: "الكتالوج", href: (base) => base },
  {
    id: "price-lists",
    label: "قوائم تفاعلية",
    href: (base) => `${base}/price-lists`,
  },
  { id: "reels", label: "فيديوهات", href: (base) => `${base}/reels` },
];

export function CatalogHomeSectionTabs({
  basePath,
  active,
  showPriceLists = true,
  showReels = true,
}: Props) {
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "price-lists") return showPriceLists;
    if (tab.id === "reels") return showReels;
    return true;
  });

  if (visibleTabs.length <= 1) return null;

  return (
    <nav
      className="flex w-full rounded-xl border border-border bg-card p-0.5 shadow-[var(--shadow-card)] sm:rounded-2xl"
      dir="rtl"
      role="tablist"
      aria-label="أقسام الكتالوج"
    >
      {visibleTabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href(basePath)}
            role="tab"
            aria-selected={isActive}
            className={`flex min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2 text-center text-[11px] font-semibold leading-tight transition sm:px-3 sm:py-2 sm:text-sm ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
