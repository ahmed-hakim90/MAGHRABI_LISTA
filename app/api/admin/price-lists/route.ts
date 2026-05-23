import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { parseAudienceFromDoc } from "@/lib/constants/catalogChannels";
import { createPriceList } from "@/lib/server/priceListImport";
import {
  getAdminUidFromRequest,
  verifyAdminUser,
} from "@/lib/server/verifyAdmin";

export async function GET(request: Request) {
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

  const snap = await db.collection("price_lists").orderBy("name").get();
  const lists = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toMillis?.() ?? null,
    updatedAt: d.data().updatedAt?.toMillis?.() ?? null,
  }));

  return NextResponse.json({ lists });
}

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

  let body: {
    name?: string;
    audience?: string;
    slug?: string;
    pdfUrl?: string;
    coverImage?: string;
    linkedFileCardId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "اسم القائمة مطلوب." }, { status: 400 });
  }

  const audience = parseAudienceFromDoc(body.audience);
  if (!audience) {
    return NextResponse.json(
      { error: "نوع القائمة (جملة/تجزئة/بدون أسعار) مطلوب." },
      { status: 400 },
    );
  }

  const result = await createPriceList(
    db,
    {
      name,
      audience,
      slug: body.slug,
      pdfUrl: body.pdfUrl,
      coverImage: body.coverImage,
      linkedFileCardId: body.linkedFileCardId,
    },
    auth.uid,
  );

  return NextResponse.json({ ok: true, ...result });
}
