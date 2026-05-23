"use client";

import type { PriceListItemPublic } from "@/lib/types/priceList";
import type { CartState } from "@/hooks/usePriceListCart";

type Props = {
  items: PriceListItemPublic[];
  cart: CartState;
  onSelect: (sku: string, selected: boolean) => void;
  onQty: (sku: string, raw: string) => void;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

const th =
  "sticky top-0 z-10 border border-[#ca8a04]/40 px-1 py-1.5 text-center font-bold md:px-2 md:py-3";
const td = "border border-[#d4d4d4] px-1 py-1 md:px-2 md:py-2";

export function PriceListTable({ items, cart, onSelect, onQty }: Props) {
  return (
    <div className="price-list-table-wrap -mx-1 overflow-x-auto overscroll-x-contain sm:mx-0">
      <table className="price-list-table w-full min-w-[min(100%,36rem)] border-collapse text-[9px] leading-tight sm:min-w-[640px] sm:text-[10px] md:min-w-[720px] md:text-sm md:leading-normal">
        <thead>
          <tr className="bg-[#FACC15] text-[#1a1a1a]">
            <th className={`${th} bg-[#FACC15]`}>#</th>
            <th className={`${th} bg-[#FACC15] text-right`}>الصنف</th>
            <th className={`${th} bg-[#FACC15]`}>الوحدة</th>
            <th className={`${th} bg-[#FDE047]`}>السعر</th>
            <th className={`${th} bg-[#FACC15]`}>اختيار</th>
            <th className={`${th} bg-[#FACC15]`}>كرتونة</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const c = cart[item.sku];
            const selected = Boolean(c?.selected);
            return (
              <tr
                key={item.id}
                className={selected ? "bg-blue-50/80" : "bg-white even:bg-[#fafafa]"}
              >
                <td
                  className={`${td} text-center font-medium text-[#444]`}
                >
                  {idx + 1}
                </td>
                <td
                  className={`${td} px-1.5 text-right font-semibold text-[#111] md:px-3`}
                >
                  <span className="block text-[10px] leading-snug sm:text-xs md:text-base">
                    {item.name}
                  </span>
                  <span
                    className="mt-0.5 block text-[8px] font-normal text-[#666] sm:text-[9px] md:text-xs"
                    dir="ltr"
                  >
                    {item.sku}
                  </span>
                </td>
                <td className={`${td} text-center text-[#333]`}>{item.unit}</td>
                <td
                  className={`${td} bg-[#FEF9C3] text-center text-[11px] font-bold text-[#111] sm:text-sm md:text-lg`}
                >
                  {formatPrice(item.price)}
                </td>
                <td className={`${td} text-center`}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-[#ca8a04] md:h-5 md:w-5"
                    checked={selected}
                    onChange={(e) => onSelect(item.sku, e.target.checked)}
                    aria-label={`اختيار ${item.name}`}
                  />
                </td>
                <td className={`${td} text-center`}>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    className="w-9 rounded border border-[#d4d4d4] px-0.5 py-0.5 text-center text-[9px] sm:w-12 sm:text-[10px] md:w-16 md:rounded-lg md:px-2 md:py-1.5 md:text-sm"
                    value={selected ? (c?.cartonQty ?? 1) : ""}
                    placeholder="—"
                    disabled={!selected}
                    onChange={(e) => onQty(item.sku, e.target.value)}
                    aria-label={`كمية ${item.name}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
