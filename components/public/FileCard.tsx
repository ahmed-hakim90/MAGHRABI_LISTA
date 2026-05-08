"use client";

import Image from "next/image";
import Link from "next/link";
import type { FileCard as FileCardType } from "@/lib/types/models";
import { formatDisplayDate } from "@/lib/utils/dates";
import type { CatalogViewMode } from "./CatalogViewToggle";

type Props = { card: FileCardType; variant?: CatalogViewMode };

export function FileCard({ card, variant = "grid" }: Props) {
  const isList = variant === "list";

  return (
    <Link
      href={`/file/${card.id}`}
      className={`group flex overflow-hidden border border-[#E5E2DA] bg-white shadow-sm transition duration-200 hover:border-[#2F3437]/15 hover:shadow-md ${
        isList
          ? "min-h-[5.5rem] flex-row items-stretch rounded-xl sm:rounded-2xl"
          : "flex-col rounded-lg sm:rounded-2xl"
      }`}
    >
      <div
        className={
          isList
            ? "relative aspect-square w-24 shrink-0 bg-[#F7F6F3] sm:w-28"
            : "relative aspect-square w-full bg-[#F7F6F3] sm:aspect-[4/3]"
        }
      >
        {card.thumbnailUrl ? (
          <Image
            src={card.thumbnailUrl}
            alt=""
            fill
            className="object-cover transition duration-200 group-hover:opacity-95"
            sizes={
              isList
                ? "(max-width:640px) 96px, 112px"
                : "(max-width:640px) 33vw, 33vw"
            }
            unoptimized
          />
        ) : (
          <div
            className={`flex h-full items-center justify-center text-[#6B6B6B]/40 ${
              isList ? "text-xl sm:text-2xl" : "text-lg sm:text-4xl"
            }`}
          >
            📄
          </div>
        )}
      </div>
      <div
        className={
          isList
            ? "flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:gap-2 sm:p-4"
            : "flex flex-1 flex-col gap-0.5 p-1.5 sm:gap-2 sm:p-4"
        }
      >
        <div className="flex flex-wrap items-center gap-0.5 sm:gap-2">
          <span className="rounded bg-[#F7F6F3] px-1 py-px text-[9px] font-medium text-[#6B6B6B] sm:rounded-lg sm:px-2 sm:py-0.5 sm:text-xs">
            {card.category || "General"}
          </span>
          <span className="rounded border border-[#E5E2DA] px-1 py-px text-[9px] font-medium text-[#2F3437] sm:rounded-lg sm:px-2 sm:py-0.5 sm:text-xs">
            PDF
          </span>
        </div>
        <h2 className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#2F3437] sm:text-base sm:leading-snug">
          {card.title}
        </h2>
        <p
          className={
            isList
              ? "line-clamp-2 text-sm leading-relaxed text-[#6B6B6B]"
              : "hidden line-clamp-2 text-sm leading-relaxed text-[#6B6B6B] sm:block"
          }
        >
          {card.description}
        </p>
        <p
          className={`text-[9px] text-[#6B6B6B] sm:text-xs ${
            isList ? "pt-0.5" : "mt-auto pt-0.5 sm:pt-1"
          }`}
        >
          Updated {formatDisplayDate(card.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
