"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useCatalogChannelOptional } from "@/components/public/CatalogChannelContext";
import {
  AUDIENCE_LABELS_AR,
  AUDIENCE_TO_CHANNEL,
} from "@/lib/constants/catalogChannels";
import type { PriceListItemPublic, PriceListPublic } from "@/lib/types/priceList";
import { usePriceListCart } from "@/hooks/usePriceListCart";
import { usePublicSiteSettings } from "@/hooks/usePublicSiteSettings";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { PriceListTable } from "./PriceListTable";
import { PriceListToolbar } from "./PriceListToolbar";
import { PriceListOrderBar } from "./PriceListOrderBar";
import { printPriceListDocument } from "@/lib/utils/priceListPrint";

type Props = {
  list: PriceListPublic;
  items: PriceListItemPublic[];
};

function PriceListViewInner({ list, items }: Props) {
  const channel = useCatalogChannelOptional();
  const { cart, setSelected, setQty, lines, selectedCount } =
    usePriceListCart(items);
  const site = usePublicSiteSettings();
  const { toast } = useToast();
  const channelBase =
    channel?.basePath ?? `/${AUDIENCE_TO_CHANNEL[list.audience]}`;
  const backHref = `${channelBase}/price-lists`;

  const handlePrint = useCallback(() => {
    const ok = printPriceListDocument({
      listName: list.name,
      audienceLabel: AUDIENCE_LABELS_AR[list.audience],
      items,
      cart,
    });
    if (!ok) {
      toast("تعذّر فتح نافذة الطباعة", "error");
    }
  }, [list.name, list.audience, items, cart, toast]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      toast("تم نسخ رابط القائمة", "success");
    } catch {
      toast("تعذّر نسخ الرابط", "error");
    }
  }, [toast]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
        لا توجد أصناف في هذه القائمة حاليًا.
      </div>
    );
  }

  return (
    <>
      <div className="price-list-print-root mx-auto max-w-5xl space-y-3 px-2 pb-32 pt-2 sm:space-y-4 sm:px-4">
        <header className="price-list-print-header space-y-2 border-b border-[#ca8a04]/30 pb-3 sm:pb-4">
          <Link
            href={backHref}
            className="price-list-no-print text-sm text-primary hover:underline"
          >
            ← العودة للقوائم التفاعلية
          </Link>
          <p className="price-list-no-print text-xs text-muted">
            {AUDIENCE_LABELS_AR[list.audience]}
          </p>
          <h1 className="text-lg font-bold text-[#111] sm:text-2xl">{list.name}</h1>
          <PriceListToolbar
            pdfUrl={list.pdfUrl}
            onPrint={handlePrint}
            onShare={() => void handleShare()}
          />
        </header>

        <PriceListTable
          items={items}
          cart={cart}
          onSelect={setSelected}
          onQty={setQty}
        />
      </div>

      <PriceListOrderBar
        listName={list.name}
        lines={lines}
        selectedCount={selectedCount}
        contacts={site.whatsappContacts}
        includePrices={site.priceListOrderIncludePrices}
        onToast={(msg, kind) => toast(msg, kind ?? "info")}
      />
    </>
  );
}

export function PriceListView(props: Props) {
  return (
    <ToastProvider>
      <PriceListViewInner {...props} />
    </ToastProvider>
  );
}
