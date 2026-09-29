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
  isWholesale?: boolean;
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

export function FolderedFileGrid({ cards, folders, view = "grid", isWholesale = false }: Props) {
  if (cards.length === 0) {
    return (
      <p className="py-16 text-center text-[15px] text-muted">
        {isWholesale ? "لا توجد قوائم مطابقة لبحثك" : "لا توجد ملفات مطابقة لبحثك."}
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
    return (
      <section className="space-y-4 sm:space-y-5">
        {isWholesale ? (
          <header className="flex flex-col gap-1 border-b border-[#eadfd2] pb-3 sm:gap-1.5 sm:pb-4">
            <h2 className="text-lg font-bold tracking-tight text-[#414141] sm:text-xl">القوائم المتاحة</h2>
            <p className="text-sm text-muted">قوائم الأسعار والكتالوجات بصيغة PDF</p>
          </header>
        ) : null}
        <FileGrid cards={cards} view={view} />
      </section>
    );
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
    <div className="w-full space-y-8 px-safe pb-safe-fab sm:space-y-12">
      <section className="space-y-4 sm:space-y-5">
        <header className="flex flex-col gap-1 border-b border-[#eadfd2] pb-3 sm:gap-1.5 sm:pb-4">
          <h2 className="text-lg font-bold tracking-tight text-[#414141] sm:text-xl">
            المجلدات
          </h2>
          <p className="text-sm text-muted">ملفات منظّمة حسب التصنيف</p>
        </header>
        {folderLayout}
      </section>
      {ungrouped.length > 0 ? (
        <section className="space-y-4 sm:space-y-5">
          <header className="flex flex-col gap-1 border-b border-[#eadfd2] pb-3 sm:gap-1.5 sm:pb-4">
            <h2 className="text-lg font-bold tracking-tight text-[#414141] sm:text-xl">
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
