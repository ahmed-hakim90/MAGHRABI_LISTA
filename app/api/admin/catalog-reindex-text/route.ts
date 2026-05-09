import type { Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { reindexCatalogCardTextById } from "@/lib/server/catalogTextIndex";

async function verifyAdmin(db: Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection("adminUsers").doc(uid).get();
  return snap.exists && snap.data()?.isActive === true;
}

type Body = { cardId?: string };

export const maxDuration = 120;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "غير مصرّح." }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "رمز غير صالح." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const cardId = typeof body.cardId === "string" ? body.cardId.trim() : "";
  if (!cardId) {
    return NextResponse.json({ error: "cardId مطلوب." }, { status: 400 });
  }

  let db: Firestore;
  try {
    db = getAdminFirestore();
  } catch {
    return NextResponse.json(
      { error: "إعدادات Firebase Admin غير مكتملة على الخادم." },
      { status: 503 },
    );
  }

  if (!(await verifyAdmin(db, uid))) {
    return NextResponse.json({ error: "غير مسموح." }, { status: 403 });
  }

  const result = await reindexCatalogCardTextById(cardId, db);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "failed" },
      { status: 422 },
    );
  }
  return NextResponse.json({
    ok: true,
    charCount: result.charCount,
  });
}
