import type { PriceListItemPublic } from "@/lib/types/priceList";
import type { CartState } from "@/hooks/usePriceListCart";

function formatPrice(n: number) {
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPriceListPrintHtml(options: {
  listName: string;
  audienceLabel: string;
  items: PriceListItemPublic[];
  cart: CartState;
}): string {
  const { listName, audienceLabel, items, cart } = options;
  const rows = items
    .map((item, idx) => {
      const c = cart[item.sku];
      const selected = Boolean(c?.selected);
      const qty = selected ? String(c?.cartonQty ?? 1) : "—";
      const check = selected ? "✓" : "";
      return `<tr>
  <td class="num">${idx + 1}</td>
  <td class="name">
    <div class="item-name">${escapeHtml(item.name)}</div>
    <div class="item-sku" dir="ltr">${escapeHtml(item.sku)}</div>
  </td>
  <td class="unit">${escapeHtml(item.unit)}</td>
  <td class="price">${escapeHtml(formatPrice(item.price))}</td>
  <td class="center">${check}</td>
  <td class="center">${escapeHtml(qty)}</td>
</tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(listName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12mm;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1 { margin: 0 0 4px; font-size: 18pt; }
    .meta { margin: 0 0 12px; font-size: 10pt; color: #555; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #d4d4d4;
      padding: 4px 6px;
      vertical-align: top;
    }
    thead th {
      background: #facc15;
      font-weight: 700;
      text-align: center;
    }
    thead th.price-h { background: #fde047; }
    tbody tr:nth-child(even) { background: #fafafa; }
    td.num, td.center { text-align: center; vertical-align: middle; }
    td.name { text-align: right; }
    td.unit { text-align: center; }
    td.price {
      text-align: center;
      font-weight: 700;
      background: #fef9c3;
      font-size: 10pt;
    }
    .item-name { font-weight: 600; line-height: 1.35; }
    .item-sku { margin-top: 2px; font-size: 8pt; color: #666; }
    @page { margin: 10mm; }
  </style>
</head>
<body>
  <h1>${escapeHtml(listName)}</h1>
  <p class="meta">${escapeHtml(audienceLabel)}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>الصنف</th>
        <th>الوحدة</th>
        <th class="price-h">السعر</th>
        <th>اختيار</th>
        <th>كرتونة</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

/** طباعة الجدول المعروض (وليس ملف PDF المرتبط). */
export function printPriceListDocument(options: {
  listName: string;
  audienceLabel: string;
  items: PriceListItemPublic[];
  cart: CartState;
}): boolean {
  if (typeof document === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "طباعة قائمة الأسعار");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(buildPriceListPrintHtml(options));
  doc.close();

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 300);
  };

  win.onafterprint = cleanup;
  window.setTimeout(cleanup, 120_000);

  window.requestAnimationFrame(() => {
    win.focus();
    win.print();
  });

  return true;
}
