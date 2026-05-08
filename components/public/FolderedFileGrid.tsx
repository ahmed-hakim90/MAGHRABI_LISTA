"use client";

import type { FileCard as FileCardType, FileFolder } from "@/lib/types/models";
import type { CatalogViewMode } from "./CatalogViewToggle";
import { FileCard } from "./FileCard";
import { FileGrid } from "./FileGrid";
import { FolderCard } from "./FolderCard";

type Props = {
  cards: FileCardType[];
  folders: FileFolder[];
  view?: CatalogViewMode;
};

function CardGrid({
  cards,
  view,
}: {
  cards: FileCardType[];
  view: CatalogViewMode;
}) {
  if (view === "list") {
    return (
      <div className="flex flex-col gap-2 sm:gap-3">
        {cards.map((c) => (
          <FileCard key={c.id} card={c} variant="list" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-4 lg:grid-cols-3">
      {cards.map((c) => (
        <FileCard key={c.id} card={c} variant="grid" />
      ))}
    </div>
  );
}

export function FolderedFileGrid({ cards, folders, view = "grid" }: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-[15px] text-[#6B6B6B]">
        لا توجد ملفات مطابقة لبحثك.
      </p>
    );
  }

  const ungrouped = cards.filter((c) => !c.folderId);
  const grouped = new Map<string, FileCardType[]>();
  for (const c of cards) {
    if (!c.folderId) continue;
    const arr = grouped.get(c.folderId) ?? [];
    arr.push(c);
    grouped.set(c.folderId, arr);
  }

  const orderedFolders = folders.filter((f) => grouped.has(f.id));

  if (orderedFolders.length === 0) {
    return <FileGrid cards={cards} view={view} />;
  }

  const folderLayout =
    view === "list" ? (
      <div className="flex max-w-3xl flex-col gap-2 sm:gap-3">
        {orderedFolders.map((f) => (
          <FolderCard
            key={f.id}
            folder={f}
            fileCount={grouped.get(f.id)?.length ?? 0}
            variant="list"
          />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 lg:grid-cols-3">
        {orderedFolders.map((f) => (
          <FolderCard
            key={f.id}
            folder={f}
            fileCount={grouped.get(f.id)?.length ?? 0}
            variant="grid"
          />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-3 pb-16 sm:px-4">
      <section className="space-y-3">
        <header className="border-b border-[#E5E2DA] pb-2">
          <h2 className="text-lg font-semibold text-[#2F3437]">المجلدات</h2>
        </header>
        {folderLayout}
      </section>
      {ungrouped.length > 0 ? (
        <section className="space-y-3">
          <header className="border-b border-[#E5E2DA] pb-2">
            <h2 className="text-lg font-semibold text-[#2F3437]">
              ملفات بدون مجلد
            </h2>
          </header>
          <CardGrid cards={ungrouped} view={view} />
        </section>
      ) : null}
    </div>
  );
}
