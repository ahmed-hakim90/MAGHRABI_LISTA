"use client";

import Link from "next/link";
import type { FileFolder } from "@/lib/types/models";
import type { CatalogViewMode } from "./CatalogViewToggle";

type Props = {
  folder: FileFolder;
  fileCount: number;
  variant?: CatalogViewMode;
};

export function FolderCard({ folder, fileCount, variant = "grid" }: Props) {
  const isList = variant === "list";

  return (
    <Link
      href={`/folder/${folder.id}`}
      className={`group flex overflow-hidden border border-[#E5E2DA] bg-white shadow-sm transition duration-200 hover:border-[#2F3437]/15 hover:shadow-md ${
        isList
          ? "min-h-[5.5rem] flex-row items-stretch rounded-xl sm:rounded-2xl"
          : "flex-col rounded-lg sm:rounded-2xl"
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center bg-[#F7F6F3] text-[#6B6B6B]/45 transition duration-200 group-hover:text-[#6B6B6B]/60 ${
          isList
            ? "aspect-square w-24 text-xl sm:w-28 sm:text-2xl"
            : "aspect-square w-full text-2xl sm:aspect-[4/3] sm:text-5xl"
        }`}
      >
        📁
      </div>
      <div
        className={
          isList
            ? "flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:gap-2 sm:p-4"
            : "flex flex-1 flex-col gap-0.5 p-1.5 sm:gap-2 sm:p-4"
        }
      >
        <h2 className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#2F3437] sm:text-base sm:leading-snug">
          {folder.name}
        </h2>
        {folder.description ? (
          <p
            className={
              isList
                ? "line-clamp-2 text-sm leading-relaxed text-[#6B6B6B]"
                : "hidden line-clamp-2 text-sm leading-relaxed text-[#6B6B6B] sm:block"
            }
          >
            {folder.description}
          </p>
        ) : null}
        <p
          className={`text-[9px] text-[#6B6B6B] sm:text-xs ${
            isList ? "pt-0.5" : "mt-auto pt-0.5 sm:pt-1"
          }`}
        >
          {fileCount} ملفات
        </p>
      </div>
    </Link>
  );
}
