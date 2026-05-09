"use client";

import type { FileCard as FileCardType, FileFolder } from "@/lib/types/models";
import {
  CatalogFileListHeader,
  catalogListContainerClass,
} from "./CatalogFileListHeader";
import {
  CATALOG_GRID_CLASS,
  CATALOG_GRID_PRIORITY_COUNT,
} from "./catalogLayout";
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
      <div className={catalogListContainerClass}>
        <CatalogFileListHeader kind="files" />
        <div role="list">
          {cards.map((c) => (
            <div key={c.id} role="listitem">
              <FileCard card={c} variant="list" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={CATALOG_GRID_CLASS}>
      {cards.map((c, index) => (
        <FileCard
          key={c.id}
          card={c}
          variant="grid"
          imagePriority={index < CATALOG_GRID_PRIORITY_COUNT}
        />
      ))}
    </div>
  );
}

export function FolderedFileGrid({ cards, folders, view = "grid" }: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-[15px] text-muted">
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
      <div className={catalogListContainerClass}>
        <CatalogFileListHeader kind="folders" />
        <div role="list">
          {orderedFolders.map((f) => (
            <div key={f.id} role="listitem">
              <FolderCard
                folder={f}
                fileCount={grouped.get(f.id)?.length ?? 0}
                variant="list"
              />
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className={CATALOG_GRID_CLASS}>
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
    <div className="w-full space-y-6 px-safe pb-safe-fab sm:space-y-10 sm:px-4">
      <section className="space-y-2 sm:space-y-4">
        <header className="flex flex-col gap-0.5 border-b border-primary/15 pb-2 sm:gap-1 sm:pb-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            المجلدات
          </h2>
          <p className="text-sm text-muted">ملفات منظّمة حسب التصنيف</p>
        </header>
        {folderLayout}
      </section>
      {ungrouped.length > 0 ? (
        <section className="space-y-2 sm:space-y-4">
          <header className="flex flex-col gap-0.5 border-b border-primary/15 pb-2 sm:gap-1 sm:pb-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              القوائم والكتالوجات
            </h2>
            <p className="text-sm text-muted">عرض مباشر لقوائم الأسعار</p>
          </header>
          <CardGrid cards={ungrouped} view={view} />
        </section>
      ) : null}
    </div>
  );
}
