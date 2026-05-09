"use client";

import Link from "next/link";
import { useCatalogChannel } from "@/components/public/CatalogChannelContext";
import type { FileFolder } from "@/lib/types/models";
import { formatDisplayDate } from "@/lib/utils/dates";
import {
  CatalogListKebab,
  catalogListRowClass,
} from "./CatalogFileListHeader";
import type { CatalogViewMode } from "./CatalogViewToggle";

type Props = {
  folder: FileFolder;
  fileCount: number;
  variant?: CatalogViewMode;
};

const gridShellDrive =
  "group/folder flex min-w-0 touch-manipulation flex-col overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm transition duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:hover:border-border [@media(hover:hover)]:hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function FolderCard({ folder, fileCount, variant = "grid" }: Props) {
  const { basePath } = useCatalogChannel();
  const isList = variant === "list";
  const href = `${basePath}/folder/${folder.id}`;

  if (isList) {
    const updated =
      folder.updatedAt != null ? (
        <time
          dateTime={folder.updatedAt.toDate().toISOString()}
          className="text-[13px] text-foreground/90 sm:text-sm"
        >
          {formatDisplayDate(folder.updatedAt)}
        </time>
      ) : (
        <span className="text-[13px] text-muted sm:text-sm">—</span>
      );

    const countLabel = `${fileCount.toLocaleString("ar")} ملفات`;

    return (
      <article className={`${catalogListRowClass} min-w-0`} dir="rtl">
        <Link
          href={href}
          className="absolute inset-y-0 start-0 z-0 end-10 rounded-none"
          aria-label={`فتح مجلد ${folder.name}`}
        />
        <div className="relative z-[1] flex min-w-0 flex-1 items-center gap-2 pointer-events-none sm:gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-100 to-amber-50 text-lg sm:h-10 sm:w-10 sm:text-xl"
            aria-hidden
          >
            📁
          </span>
          <div className="min-w-0 flex-1 ps-0.5">
            <h2 className="truncate text-[13px] font-semibold text-foreground sm:text-sm">
              {folder.name}
            </h2>
          </div>
          <div className="w-[6.5rem] shrink-0 text-end sm:w-32">{updated}</div>
          <div className="hidden w-24 shrink-0 text-end text-[13px] text-foreground/90 sm:block sm:text-sm">
            {countLabel}
          </div>
        </div>
        <div className="relative z-[2] shrink-0 pointer-events-auto">
          <CatalogListKebab
            href={href}
            title={folder.name}
            viewLabel="فتح المجلد"
          />
        </div>
      </article>
    );
  }

  return (
    <Link href={href} className={gridShellDrive}>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-primary/[0.08] to-surface">
        <div
          className="flex h-full w-full items-center justify-center text-5xl transition duration-300 [@media(hover:hover)]:group-hover/folder:scale-[1.03] sm:text-6xl"
          aria-hidden
        >
          <span className="opacity-90">📁</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 border-t border-border/70 px-2 py-2 sm:px-2.5 sm:py-2.5">
        <h2 className="line-clamp-2 text-center text-[11px] font-semibold leading-snug text-foreground sm:text-xs">
          {folder.name}
        </h2>
        <p className="line-clamp-1 text-center text-[10px] text-muted sm:text-[11px]">
          {fileCount.toLocaleString("ar")} ملفات
          {folder.updatedAt ? (
            <>
              <span className="text-border" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <time dateTime={folder.updatedAt.toDate().toISOString()}>
                {formatDisplayDate(folder.updatedAt)}
              </time>
            </>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
