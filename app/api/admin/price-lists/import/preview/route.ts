import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  buildImportPreview,
  parseExcelBuffer,
} from "@/lib/server/priceListImport";
import {
  getAdminUidFromRequest,
  verifyAdminUser,
} from "@/lib/server/verifyAdmin";

export const maxDuration = 120;

export async function POST(request: Request) {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth.error;

  let db;
  try {
    db = getAdminFirestore();
  } catch {
    return NextResponse.json(
      { error: "إعدادات Firebase Admin غير مكتملة." },
      { status: 503 },
    );
  }

  if (!(await verifyAdminUser(db, auth.uid))) {
    return NextResponse.json({ error: "غير مسموح." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const listId = String(form.get("listId") ?? "").trim() || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ملف Excel مطلوب." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors: parseErrors } = parseExcelBuffer(buffer, listId);
  const preview = await buildImportPreview(db, rows, parseErrors, listId);

  if ("error" in preview) {
    return NextResponse.json({ error: preview.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, preview });
}
