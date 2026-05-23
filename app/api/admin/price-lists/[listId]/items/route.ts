import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { priceListItemDocId } from "@/lib/utils/slug";
import {
  getAdminUidFromRequest,
  verifyAdminUser,
} from "@/lib/server/verifyAdmin";

type Ctx = { params: Promise<{ listId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth.error;

  const { listId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

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

  const snap = await db
    .collection("price_list_items")
    .where("listId", "==", listId)
    .get();

  let items: Array<{ id: string } & Record<string, unknown>> = snap.docs.map(
    (d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }),
  );
  items.sort((a, b) => {
    const ao = Number(a.sortOrder ?? 0);
    const bo = Number(b.sortOrder ?? 0);
    return ao - bo || String(a.sku ?? "").localeCompare(String(b.sku ?? ""));
  });
  if (q) {
    items = items.filter((it) => {
      const sku = String(it.sku ?? "").toLowerCase();
      const name = String(it.name ?? "").toLowerCase();
      return sku.includes(q) || name.includes(q);
    });
  }

  return NextResponse.json({ items });
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

  let body: {
    sku?: string;
    itemId?: string;
    price?: number;
    imageUrl?: string;
    isActive?: boolean;
    name?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const sku = String(body.sku ?? "").trim();
  const itemId =
    body.itemId?.trim() || (sku ? priceListItemDocId(listId, sku) : "");
  if (!itemId) {
    return NextResponse.json({ error: "معرّف الصنف مطلوب." }, { status: 400 });
  }

  const ref = db.collection("price_list_items").doc(itemId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.listId !== listId) {
    return NextResponse.json({ error: "الصنف غير موجود." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.uid,
  };
  if (typeof body.price === "number" && Number.isFinite(body.price)) {
    updates.price = body.price;
  }
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl.trim();
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  if (typeof body.name === "string") updates.name = body.name.trim();

  await ref.update(updates);
  const next = await ref.get();
  return NextResponse.json({ ok: true, item: { id: next.id, ...next.data() } });
}
