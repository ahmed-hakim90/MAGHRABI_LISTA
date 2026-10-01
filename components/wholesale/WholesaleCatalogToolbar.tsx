"use client";

import type { RefObject } from "react";
import {
  CatalogViewToggle,
  type CatalogViewMode,
} from "@/components/public/CatalogViewToggle";

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  searchId?: string;
  view: CatalogViewMode;
  onViewChange: (view: CatalogViewMode) => void;
};

/**
 * Single-row catalog control for the PDF library: a full-width search field
 * plus a compact grid/list switch. Category filtering is intentionally not
 * exposed on the wholesale page; search spans every available list.
 */
export function WholesaleCatalogToolbar({
  searchValue,
  onSearchChange,
  inputRef,
  searchId = "wholesale-search",
  view,
  onViewChange,
}: Props) {
  return (
    <div className="pt-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1" dir="rtl">
          <label htmlFor={searchId} className="sr-only">
            بحث في القوائم
          </label>
          <span
            className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-muted"
            aria-hidden
          >
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id={searchId}
            type="search"
            autoComplete="off"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث باسم القائمة…"
            className="h-11 w-full rounded-lg border border-border bg-white ps-11 pe-4 text-[14px] font-medium text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-brand-red/50 focus:ring-[3px] focus:ring-brand-red/15 sm:text-[15px]"
          />
        </div>
        <div className="flex shrink-0 items-center">
          <CatalogViewToggle value={view} onChange={onViewChange} />
        </div>
      </div>
    </div>
  );
}
