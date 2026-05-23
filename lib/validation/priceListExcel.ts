import type { ExcelImportRow, ImportRowError } from "@/lib/types/priceList";

type ColumnField =
  | keyof ExcelImportRow
  | "pdfUrl"
  | "listId"
  | "listName";

const COLUMN_ALIASES: Record<string, ColumnField> = {
  listid: "listId",
  قائمة: "listId",
  listname: "listName",
  اسم_القائمة: "listName",
  اسمالقائمة: "listName",
  sku: "sku",
  itemcode: "sku",
  item_code: "sku",
  كود: "sku",
  كودالصنف: "sku",
  كود_الصنف: "sku",
  كودصنف: "sku",
  itemname: "name",
  name: "name",
  اسم: "name",
  اسمالصنف: "name",
  اسم_الصنف: "name",
  اسمصنف: "name",
  unit: "unit",
  وحدة: "unit",
  الوحدة: "unit",
  cartonqty: "cartonQty",
  كرتونة: "cartonQty",
  price: "price",
  سعر: "price",
  السعر: "price",
  sortorder: "sortOrder",
  ترتيب: "sortOrder",
  isactive: "isActive",
  نشط: "isActive",
  pdfurl: "pdfUrl",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/^ال/, "")
    .replace(/أ/g, "ا")
    .replace(/إ/g, "ا")
    .replace(/آ/g, "ا")
    .replace(/ة/g, "ه");
}

function resolveColumnKey(header: string): ColumnField | null {
  const n = normalizeHeader(header);
  if (!n) return null;
  const exact = COLUMN_ALIASES[n];
  if (exact) return exact;

  if (n.includes("listid") || n === "قائمة" || n.includes("اسمقائمة")) {
    return n.includes("اسم") ? "listName" : "listId";
  }
  if (
    n.includes("sku") ||
    n.includes("كود") ||
    n.includes("code") ||
    n.includes("itemcode")
  ) {
    return "sku";
  }
  if (n.includes("اسم") || n.includes("name") || n.includes("itemname")) {
    if (n.includes("قائمة") || n.includes("list")) return "listName";
    return "name";
  }
  if (n.includes("وحده") || n.includes("unit")) return "unit";
  if (n.includes("كرتون") || n.includes("carton")) return "cartonQty";
  if (n.includes("سعر") || n === "price") return "price";
  if (n.includes("ترتيب") || n.includes("sort")) return "sortOrder";
  if (n.includes("نشط") || n.includes("active")) return "isActive";
  if (n.includes("pdf")) return "pdfUrl";

  return null;
}

export function mapExcelHeaders(headers: string[]): Map<number, ColumnField> {
  const map = new Map<number, ColumnField>();
  headers.forEach((h, i) => {
    const key = resolveColumnKey(h);
    if (key) map.set(i, key);
  });
  return map;
}

/** Find the header row when the sheet has title rows above the table. */
export function findHeaderRowIndex(data: unknown[][]): number {
  let bestIdx = 0;
  let bestScore = 0;
  const limit = Math.min(data.length, 20);
  for (let i = 0; i < limit; i++) {
    const headers = (data[i] ?? []).map((h) => String(h ?? ""));
    const colMap = mapExcelHeaders(headers);
    let score = colMap.size;
    if (colMap.size >= 2) {
      const fields = new Set(colMap.values());
      if (fields.has("sku")) score += 2;
      if (fields.has("name")) score += 2;
      if (fields.has("price")) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function parseBool(v: unknown, defaultVal: boolean): boolean {
  if (v === undefined || v === null || v === "") return defaultVal;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "نعم", "y"].includes(s)) return true;
  if (["0", "false", "no", "لا", "n"].includes(s)) return false;
  return defaultVal;
}

function parseNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function cellText(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

export function rowFromSheetCells(
  rowNumber: number,
  cells: unknown[],
  colMap: Map<number, ColumnField>,
  fixedListId?: string,
): { row: ExcelImportRow | null; errors: ImportRowError[] } {
  const errors: ImportRowError[] = [];
  const raw: Record<string, unknown> = {};

  colMap.forEach((field, colIdx) => {
    raw[field] = cells[colIdx];
  });

  const sku = cellText(raw.sku);
  const nameRaw = cellText(raw.name);
  const listId = fixedListId || cellText(raw.listId);
  const listName = cellText(raw.listName);
  const unit = cellText(raw.unit) || "كرتونة";
  const pdfUrl = cellText(raw.pdfUrl);

  // تخطّي الصفوف الفارغة
  if (!sku && !nameRaw) {
    return { row: null, errors: [] };
  }

  // بدون كود صنف: تخطي (يمكن إعادة رفع الملف لاحقًا بعد التصحيح)
  if (!sku) {
    return {
      row: null,
      errors: [
        {
          rowNumber,
          sku: "",
          field: "sku",
          message: "تم تخطي الصف — كود الصنف غير موجود",
          severity: "skipped",
        },
      ],
    };
  }

  const name = nameRaw || sku;

  if (!listId) {
    errors.push({
      rowNumber,
      sku,
      field: "listId",
      message: "معرّف القائمة (listId) مطلوب",
      severity: "error",
    });
  }

  const price = parseNumber(raw.price);
  if (price === null) {
    return {
      row: null,
      errors: [
        {
          rowNumber,
          sku,
          field: "price",
          message: "تم تخطي الصف — السعر غير صالح",
          severity: "skipped",
        },
      ],
    };
  }
  if (price < 0) {
    return {
      row: null,
      errors: [
        {
          rowNumber,
          sku,
          field: "price",
          message: "تم تخطي الصف — السعر سالب",
          severity: "skipped",
        },
      ],
    };
  }

  let cartonQty = parseNumber(raw.cartonQty) ?? 1;
  if (cartonQty < 1) {
    cartonQty = 1;
  }

  const sortOrder = parseNumber(raw.sortOrder) ?? rowNumber - 1;

  if (errors.some((e) => e.severity === "error")) {
    return { row: null, errors };
  }

  return {
    row: {
      rowNumber,
      listId,
      listName,
      sku,
      name,
      imageUrl: "",
      unit,
      cartonQty,
      price: price ?? 0,
      sortOrder,
      isActive: parseBool(raw.isActive, true),
      pdfUrl,
    },
    errors,
  };
}
