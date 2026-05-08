"use client";

import Link from "next/link";
import type { FileFolder } from "@/lib/types/models";

type Props = { folder: FileFolder; fileCount: number };

export function FolderCard({ folder, fileCount }: Props) {
  return (
    <Link
      href={`/folder/${folder.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm transition duration-200 hover:border-[#2F3437]/15 hover:shadow-md"
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-[#F7F6F3] text-5xl text-[#6B6B6B]/45 transition duration-200 group-hover:text-[#6B6B6B]/60">
        📁
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[#2F3437]">
          {folder.name}
        </h2>
        {folder.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-[#6B6B6B]">
            {folder.description}
          </p>
        ) : null}
        <p className="mt-auto pt-1 text-xs text-[#6B6B6B]">
          {fileCount} ملفات
        </p>
      </div>
    </Link>
  );
}
