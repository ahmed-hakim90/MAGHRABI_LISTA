"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CatalogViewMode = "grid" | "list";

const STORAGE_KEY = "maghrabi_lista_catalog_view";

const listeners = new Set<() => void>();

export function readStoredCatalogView(): CatalogViewMode {
  if (typeof window === "undefined") return "grid";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "list" ? "list" : "grid";
}

function notifyCatalogViewListeners() {
  listeners.forEach((l) => l());
}

function subscribeCatalogView(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getCatalogViewSnapshot(): CatalogViewMode {
  return readStoredCatalogView();
}

function getCatalogViewServerSnapshot(): CatalogViewMode {
  return "grid";
}

export function persistCatalogView(mode: CatalogViewMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  notifyCatalogViewListeners();
}

export function useCatalogView() {
  const view = useSyncExternalStore(
    subscribeCatalogView,
    getCatalogViewSnapshot,
    getCatalogViewServerSnapshot,
  );
  const setView = useCallback((mode: CatalogViewMode) => {
    persistCatalogView(mode);
  }, []);
  return [view, setView] as const;
}

type Props = {
  value: CatalogViewMode;
  onChange: (mode: CatalogViewMode) => void;
};

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function CatalogViewToggle({ value, onChange }: Props) {
  return (
    <div
      className="inline-flex rounded-lg border border-[#E5E2DA] bg-white p-0.5 shadow-sm sm:rounded-xl"
      dir="rtl"
      role="group"
      aria-label="طريقة العرض"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm ${
          value === "grid"
            ? "bg-[#2F3437] text-white shadow-sm"
            : "text-[#6B6B6B] hover:bg-[#F7F6F3] hover:text-[#2F3437]"
        }`}
        aria-pressed={value === "grid"}
        aria-label="عرض شبكة"
        title="شبكة"
      >
        <GridIcon />
        <span className="hidden sm:inline">شبكة</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm ${
          value === "list"
            ? "bg-[#2F3437] text-white shadow-sm"
            : "text-[#6B6B6B] hover:bg-[#F7F6F3] hover:text-[#2F3437]"
        }`}
        aria-pressed={value === "list"}
        aria-label="عرض قائمة"
        title="قائمة"
      >
        <ListIcon />
        <span className="hidden sm:inline">قائمة</span>
      </button>
    </div>
  );
}
