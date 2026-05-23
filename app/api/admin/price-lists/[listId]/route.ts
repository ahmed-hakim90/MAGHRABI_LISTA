import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { syncListIsActiveOnItems } from "@/lib/server/priceListImport";
import { parseAudienceFromDoc } from "@/lib/constants/catalogChannels";
import { normalizeSlug } from "@/lib/utils/slug";
import {
  getAdminUidFromRequest,
  verifyAdminUser,
} from "@/lib/server/verifyAdmin";

type Ctx = { params: Promise<{ listId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth.error;

  const { listId } = await ctx.params;
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

  const snap = await db.collection("price_lists").doc(listId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "غير موجود." }, { status: 404 });
  }

  return NextResponse.json({
    list: { id: snap.id, ...snap.data() },
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth.error;

  const { listId } = await ctx.params;
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const ref = db.collection("price_lists").doc(listId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "غير موجود." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.uid,
  };

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.slug === "string") updates.slug = normalizeSlug(body.slug);
  if (typeof body.pdfUrl === "string") updates.pdfUrl = body.pdfUrl.trim();
  if (typeof body.coverImage === "string") updates.coverImage = body.coverImage.trim();
  if (typeof body.linkedFileCardId === "string") {
    updates.linkedFileCardId = body.linkedFileCardId.trim();
  }
  const audience = parseAudienceFromDoc(body.audience);
  if (audience) updates.audience = audience;
  if (typeof body.isActive === "boolean") {
    updates.isActive = body.isActive;
    await syncListIsActiveOnItems(db, listId, body.isActive);
  }

  await ref.update(updates);
  const next = await ref.get();
  return NextResponse.json({ ok: true, list: { id: next.id, ...next.data() } });
}
