import { NextResponse } from "next/server";
import type { ImportPreviewResult } from "@/lib/types/priceList";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { commitImport } from "@/lib/server/priceListImport";
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

  let body: { preview?: ImportPreviewResult };
  try {
    body = (await request.json()) as { preview?: ImportPreviewResult };
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const preview = body.preview;
  if (!preview?.listId || !Array.isArray(preview.rows)) {
    return NextResponse.json({ error: "معاينة الاستيراد مطلوبة." }, { status: 400 });
  }

  const result = await commitImport(db, preview, auth.uid);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
