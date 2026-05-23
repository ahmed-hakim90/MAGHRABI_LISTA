import type { CartLine } from "@/lib/types/priceList";

export function buildPriceListOrderMessage(
  listName: string,
  lines: CartLine[],
  includePrices: boolean,
): string {
  const header = `طلب جديد من قائمة أسعار ${listName}:\n\n`;
  const body = lines
    .map((line, i) => {
      let block = `${i + 1}- ${line.name}\nالكمية: ${line.cartonQty} كرتونة`;
      if (includePrices && line.price != null) {
        block += `\nالسعر: ${formatPrice(line.price)}`;
      }
      return block;
    })
    .join("\n\n");
  return header + body;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function whatsAppUrl(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
