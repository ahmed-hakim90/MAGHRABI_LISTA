"use client";

import {
  CatalogViewToggle,
  type CatalogViewMode,
} from "@/components/public/CatalogViewToggle";
import { SearchBox } from "@/components/public/SearchBox";

type Props = {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  catalogView: CatalogViewMode;
  onCatalogViewChange: (mode: CatalogViewMode) => void;
};

export function CatalogSearchBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  catalogView,
  onCatalogViewChange,
}: Props) {
  return (
    <div
      className="flex flex-row items-center gap-2"
      dir="rtl"
    >
      <SearchBox
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="mx-0 flex min-w-0 flex-1 max-w-none px-0 sm:px-0"
      />
      <div className="shrink-0">
        <CatalogViewToggle
          value={catalogView}
          onChange={onCatalogViewChange}
        />
      </div>
    </div>
  );
}
