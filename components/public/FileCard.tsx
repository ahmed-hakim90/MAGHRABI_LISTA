"use client";

import Image from "next/image";
import Link from "next/link";
import type { FileCard as FileCardType } from "@/lib/types/models";
import { formatDisplayDate } from "@/lib/utils/dates";

type Props = { card: FileCardType };

export function FileCard({ card }: Props) {
  return (
    <Link
      href={`/file/${card.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5E2DA] bg-white shadow-sm transition duration-200 hover:border-[#2F3437]/15 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-[#F7F6F3]">
        {card.thumbnailUrl ? (
          <Image
            src={card.thumbnailUrl}
            alt=""
            fill
            className="object-cover transition duration-200 group-hover:opacity-95"
            sizes="(max-width:640px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-[#6B6B6B]/40">
            📄
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#F7F6F3] px-2 py-0.5 text-xs font-medium text-[#6B6B6B]">
            {card.category || "General"}
          </span>
          <span className="rounded-lg border border-[#E5E2DA] px-2 py-0.5 text-xs font-medium text-[#2F3437]">
            PDF
          </span>
        </div>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[#2F3437]">
          {card.title}
        </h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-[#6B6B6B]">
          {card.description}
        </p>
        <p className="mt-auto pt-1 text-xs text-[#6B6B6B]">
          Updated {formatDisplayDate(card.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
