"use client";

import { createContext, useContext } from "react";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";

export type CatalogChannelContextValue = {
  basePath: string;
  audience: CatalogAudience;
};

const CatalogChannelContext = createContext<CatalogChannelContextValue | null>(
  null,
);

export function CatalogChannelProvider({
  value,
  children,
}: {
  value: CatalogChannelContextValue;
  children: React.ReactNode;
}) {
  return (
    <CatalogChannelContext.Provider value={value}>
      {children}
    </CatalogChannelContext.Provider>
  );
}

export function useCatalogChannel(): CatalogChannelContextValue {
  const v = useContext(CatalogChannelContext);
  if (!v) {
    throw new Error("useCatalogChannel must be used under CatalogChannelProvider");
  }
  return v;
}

/** For components that may render outside a channel (e.g. dev); prefer useCatalogChannel in public catalog. */
export function useCatalogChannelOptional(): CatalogChannelContextValue | null {
  return useContext(CatalogChannelContext);
}
