import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import * as XLSX from "xlsx";
import type {
  ExcelImportRow,
  ImportPreviewChange,
  ImportPreviewResult,
  ImportRowError,
  PriceListItem,
} from "@/lib/types/priceList";
import {
  findHeaderRowIndex,
  mapExcelHeaders,
  rowFromSheetCells,
} from "@/lib/validation/priceListExcel";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { normalizeSlug, priceListItemDocId } from "@/lib/utils/slug";

const ITEMS_COLLECTION = "price_list_items";
const LISTS_COLLECTION = "price_lists";

function importStatsFromErrors(parseErrors: ImportRowError[]) {
  return {
    errors: parseErrors.filter((e) => e.severity === "error").length,
    warnings: parseErrors.filter((e) => e.severity === "warning").length,
    skipped: parseErrors.filter((e) => e.severity === "skipped").length,
  };
}

function itemFromDoc(id: string, data: FirebaseFirestore.DocumentData): PriceListItem {
  return {
    id,
    listId: String(data.listId ?? ""),
    sku: String(data.sku ?? ""),
    name: String(data.name ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    unit: String(data.unit ?? ""),
    cartonQty: Number(data.cartonQty ?? 1),
    price: Number(data.price ?? 0),
    sortOrder: Number(data.sortOrder ?? 0),
    isActive: Boolean(data.isActive),
    listIsActive: Boolean(data.listIsActive ?? true),
    createdAt: null,
    updatedAt: null,
    lastImportedAt: null,
  };
}

export function parseExcelBuffer(
  buffer: Buffer,
  fixedListId?: string,
): { rows: ExcelImportRow[]; errors: ImportRowError[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          sku: "",
          message: "الملف فارغ أو لا يحتوي على أوراق",
          severity: "error",
        },
      ],
    };
  }
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  if (data.length < 2) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          sku: "",
          message: "يجب أن يحتوي الملف على صف عناوين وصف واحد على الأقل",
          severity: "error",
        },
      ],
    };
  }

  const headerRowIdx = findHeaderRowIndex(data);
  const headers = (data[headerRowIdx] ?? []).map((h) => String(h ?? ""));
  const colMap = mapExcelHeaders(headers);
  if (colMap.size === 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: headerRowIdx + 1,
          sku: "",
          message:
            "لم يتم التعرف على أعمدة الملف. استخدم: كود الصنف، اسم الصنف، السعر (أو sku, name, price)",
          severity: "error",
        },
      ],
    };
  }

  const rows: ExcelImportRow[] = [];
  const errors: ImportRowError[] = [];
  const skuSeen = new Set<string>();

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const cells = data[i] ?? [];
    const rowNumber = i + 1;
    const { row, errors: rowErrors } = rowFromSheetCells(
      rowNumber,
      cells,
      colMap,
      fixedListId,
    );
    errors.push(...rowErrors);
    if (!row) continue;

    const skuKey = `${row.listId}::${row.sku.toLowerCase()}`;
    if (skuSeen.has(skuKey)) {
      errors.push({
        rowNumber,
        sku: row.sku,
        message: `تم تخطي الصف — SKU مكرر في الملف: ${row.sku}`,
        severity: "skipped",
      });
      continue;
    }
    skuSeen.add(skuKey);
    rows.push(row);
  }

  return { rows, errors };
}

export async function buildImportPreview(
  db: Firestore,
  rows: ExcelImportRow[],
  parseErrors: ImportRowError[],
  targetListId?: string,
): Promise<ImportPreviewResult | { error: string }> {
  const parseIssueStats = importStatsFromErrors(parseErrors);

  if (rows.length === 0) {
    return {
      listId: targetListId ?? "",
      listName: "",
      pdfUrl: null,
      stats: {
        create: 0,
        update: 0,
        deactivate: 0,
        ...parseIssueStats,
      },
      changes: [],
      errors: parseErrors,
      rows: [],
    };
  }

  const listIds = new Set(rows.map((r) => r.listId));
  if (targetListId) {
    const bad = rows.filter((r) => r.listId !== targetListId);
    if (bad.length > 0) {
      return { error: "بعض الصفوف تنتمي لقائمة أخرى غير القائمة المحددة" };
    }
    listIds.clear();
    listIds.add(targetListId);
  }
  if (listIds.size > 1) {
    return { error: "الملف يحتوي على أكثر من listId. ارفع ملفًا لكل قائمة." };
  }
  const listId = targetListId ?? [...listIds][0];
  if (!listId) {
    return { error: "لم يتم تحديد قائمة أسعار" };
  }

  const listName = rows.find((r) => r.listName)?.listName ?? "";
  const pdfUrl = rows.find((r) => r.pdfUrl)?.pdfUrl ?? null;

  const existingSnap = await db
    .collection(ITEMS_COLLECTION)
    .where("listId", "==", listId)
    .get();

  const existingBySku = new Map<string, PriceListItem>();
  for (const doc of existingSnap.docs) {
    const item = itemFromDoc(doc.id, doc.data());
    existingBySku.set(item.sku.toLowerCase(), item);
  }

  const excelSkus = new Set(rows.map((r) => r.sku.toLowerCase()));
  const changes: ImportPreviewChange[] = [];

  for (const row of rows) {
    const ex = existingBySku.get(row.sku.toLowerCase());
    if (ex) {
      changes.push({ sku: row.sku, name: row.name, action: "update" });
    } else {
      changes.push({ sku: row.sku, name: row.name, action: "create" });
    }
  }

  for (const [skuLower, item] of existingBySku) {
    if (!excelSkus.has(skuLower) && item.isActive) {
      changes.push({ sku: item.sku, name: item.name, action: "deactivate" });
    }
  }

  const stats = {
    create: changes.filter((c) => c.action === "create").length,
    update: changes.filter((c) => c.action === "update").length,
    deactivate: changes.filter((c) => c.action === "deactivate").length,
    ...importStatsFromErrors(parseErrors),
  };

  return {
    listId,
    listName,
    pdfUrl: pdfUrl || null,
    stats,
    changes,
    errors: parseErrors,
    rows,
  };
}

export async function commitImport(
  db: Firestore,
  preview: ImportPreviewResult,
  adminUid: string,
): Promise<{ ok: true } | { error: string }> {
  const { listId, rows } = preview;
  if (!listId) return { error: "listId مطلوب" };

  const listRef = db.collection(LISTS_COLLECTION).doc(listId);
  const listSnap = await listRef.get();
  if (!listSnap.exists) {
    return { error: "قائمة الأسعار غير موجودة. أنشئ القائمة أولًا." };
  }

  const listData = listSnap.data()!;
  const listIsActive = Boolean(listData.isActive ?? true);
  const now = FieldValue.serverTimestamp();

  const listUpdates: Record<string, unknown> = {
    updatedAt: now,
    updatedBy: adminUid,
  };
  if (preview.listName) listUpdates.name = preview.listName;
  if (preview.pdfUrl) listUpdates.pdfUrl = preview.pdfUrl;

  const importedAt = new Date().toISOString();
  listUpdates.lastImportReport = {
    importedAt,
    create: preview.stats.create,
    update: preview.stats.update,
    deactivate: preview.stats.deactivate,
    skipped: preview.stats.skipped,
    warnings: preview.stats.warnings,
    errors: preview.stats.errors,
    issues: preview.errors.slice(0, 200),
  };

  await listRef.update(listUpdates);

  const existingSnap = await db
    .collection(ITEMS_COLLECTION)
    .where("listId", "==", listId)
    .get();

  const existingBySku = new Map<string, string>();
  for (const doc of existingSnap.docs) {
    const sku = String(doc.data().sku ?? "").toLowerCase();
    existingBySku.set(sku, doc.id);
  }

  const excelSkus = new Set(rows.map((r) => r.sku.toLowerCase()));
  const batchLimit = 450;
  let batch = db.batch();
  let ops = 0;

  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  for (const row of rows) {
    const docId = priceListItemDocId(listId, row.sku);
    const ref = db.collection(ITEMS_COLLECTION).doc(docId);
    const payload = {
      listId,
      sku: row.sku,
      name: row.name,
      imageUrl: row.imageUrl,
      unit: row.unit,
      cartonQty: row.cartonQty,
      price: row.price,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      listIsActive,
      updatedAt: now,
      lastImportedAt: now,
      updatedBy: adminUid,
    };
    const exists = existingBySku.has(row.sku.toLowerCase());
    if (exists) {
      batch.update(ref, payload);
    } else {
      batch.set(ref, {
        ...payload,
        createdAt: now,
        createdBy: adminUid,
      });
    }
    ops++;
    if (ops >= batchLimit) await flush();
  }

  for (const doc of existingSnap.docs) {
    const sku = String(doc.data().sku ?? "").toLowerCase();
    if (!excelSkus.has(sku) && doc.data().isActive !== false) {
      batch.update(doc.ref, {
        isActive: false,
        updatedAt: now,
        updatedBy: adminUid,
      });
      ops++;
      if (ops >= batchLimit) await flush();
    }
  }

  await flush();
  return { ok: true };
}

export async function syncListIsActiveOnItems(
  db: Firestore,
  listId: string,
  isActive: boolean,
): Promise<void> {
  const snap = await db
    .collection(ITEMS_COLLECTION)
    .where("listId", "==", listId)
    .get();
  const batchLimit = 450;
  let batch = db.batch();
  let ops = 0;
  for (const doc of snap.docs) {
    batch.update(doc.ref, { listIsActive: isActive });
    ops++;
    if (ops >= batchLimit) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
}

export async function createPriceList(
  db: Firestore,
  input: {
    name: string;
    audience: CatalogAudience;
    slug?: string;
    pdfUrl?: string;
    coverImage?: string;
    linkedFileCardId?: string;
  },
  adminUid: string,
): Promise<{ id: string; slug: string }> {
  const slug = normalizeSlug(input.slug || input.name) || `list-${Date.now()}`;
  const ref = db.collection(LISTS_COLLECTION).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    name: input.name.trim(),
    audience: input.audience,
    slug,
    pdfUrl: input.pdfUrl?.trim() ?? "",
    coverImage: input.coverImage?.trim() ?? "",
    linkedFileCardId: input.linkedFileCardId?.trim() ?? "",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid,
    updatedBy: adminUid,
  });
  return { id: ref.id, slug };
}
