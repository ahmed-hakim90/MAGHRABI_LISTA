import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { CatalogReelInput, ReelAudience } from "@/lib/types/reels";
import { parseVideoLink } from "@/lib/utils/videoEmbed";
import {
  getAdminUidFromRequest,
  verifyAdminUser,
} from "@/lib/server/verifyAdmin";

type Ctx = { params: Promise<{ reelId: string }> };

function parseAudience(raw: unknown): ReelAudience | null {
  if (raw === "all" || raw === "wholesale" || raw === "retail" || raw === "no_prices") {
    return raw;
  }
  return null;
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth.error;

  const { reelId } = await ctx.params;

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

  let body: Partial<CatalogReelInput>;
  try {
    body = (await request.json()) as Partial<CatalogReelInput>;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const ref = db.collection("catalog_reels").doc(reelId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "الفيديو غير موجود." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.uid,
  };

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "العنوان مطلوب." }, { status: 400 });
    }
    updates.title = title;
  }

  if (body.audience !== undefined) {
    const audience = parseAudience(body.audience);
    if (!audience) {
      return NextResponse.json({ error: "القناة غير صالحة." }, { status: 400 });
    }
    updates.audience = audience;
  }

  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    updates.sortOrder = body.sortOrder;
  }

  if (typeof body.isActive === "boolean") {
    updates.isActive = body.isActive;
  }

  if (typeof body.sourceUrl === "string" && body.sourceUrl.trim()) {
    const parsed = parseVideoLink(body.sourceUrl);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    updates.sourceUrl = parsed.data.sourceUrl;
    updates.provider = parsed.data.provider;
    updates.embedUrl = parsed.data.embedUrl;
  }

  await ref.update(updates);
  const next = await ref.get();
  return NextResponse.json({ ok: true, reel: { id: next.id, ...next.data() } });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth.error;

  const { reelId } = await ctx.params;

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

  const ref = db.collection("catalog_reels").doc(reelId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "الفيديو غير موجود." }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
