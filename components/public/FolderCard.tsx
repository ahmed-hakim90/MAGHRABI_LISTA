"use client";

import Link from "next/link";
import type { FileFolder } from "@/lib/types/models";
import type { CatalogViewMode } from "./CatalogViewToggle";

type Props = {
  folder: FileFolder;
  fileCount: number;
  variant?: CatalogViewMode;
};

const shell =
  "group/folder flex touch-manipulation overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99]";

export function FolderCard({ folder, fileCount, variant = "grid" }: Props) {
  const isList = variant === "list";

  return (
    <Link
      href={`/folder/${folder.id}`}
      className={
        isList
          ? `${shell} min-h-[5.5rem] flex-row items-stretch`
          : `${shell} flex-col`
      }
    >
      <div
        className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br from-primary/[0.07] to-surface text-2xl transition duration-300 [@media(hover:hover)]:group-hover/folder:from-primary/[0.11] sm:text-5xl ${
          isList
            ? "aspect-square w-[5.5rem] text-xl sm:w-28 sm:text-2xl"
            : "aspect-square w-full"
        }`}
        aria-hidden
      >
        <span className="opacity-90">📁</span>
      </div>
      <div
        className={
          isList
            ? "flex min-w-0 flex-1 flex-col justify-center gap-2 p-3 sm:p-4"
            : "flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4"
        }
      >
        <h2 className="line-clamp-2 text-[13px] font-bold leading-snug text-foreground sm:text-lg sm:leading-snug">
          {folder.name}
        </h2>
        {folder.description ? (
          <p
            className={
              isList
                ? "line-clamp-2 text-sm leading-relaxed text-muted"
                : "hidden line-clamp-2 text-sm leading-relaxed text-muted sm:block"
            }
          >
            {folder.description}
          </p>
        ) : null}
        <p
          className={`text-[10px] font-medium text-muted sm:text-xs ${
            isList ? "pt-0.5" : "mt-auto pt-0.5 sm:pt-1"
          }`}
        >
          {fileCount.toLocaleString("ar")} ملفات
        </p>
        <span
          className={`inline-flex min-h-touch items-center justify-center rounded-2xl border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-bold text-primary transition [@media(hover:hover)]:group-hover/folder:bg-primary [@media(hover:hover)]:group-hover/folder:text-white sm:text-sm ${
            isList ? "w-fit" : "mt-1 w-full sm:mt-2"
          }`}
        >
          فتح المجلد
        </span>
      </div>
    </Link>
  );
}
