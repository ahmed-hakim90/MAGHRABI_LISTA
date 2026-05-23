import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { CatalogReelInput, ReelAudience } from "@/lib/types/reels";
import { parseVideoLink } from "@/lib/utils/videoEmbed";
import {
  getAdminUidFromRequest,
  verifyAdminUser,
} from "@/lib/server/verifyAdmin";

function parseAudience(raw: unknown): ReelAudience | null {
  if (raw === "all" || raw === "wholesale" || raw === "retail" || raw === "no_prices") {
    return raw;
  }
  return null;
}

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

  const snap = await db.collection("catalog_reels").get();

  const reels = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        ...data,
        createdAt:
          (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ??
          null,
        updatedAt:
          (data.updatedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ??
          null,
      };
    })
    .sort((a, b) => {
      const ar = a as Record<string, unknown>;
      const br = b as Record<string, unknown>;
      return (
        Number(ar.sortOrder ?? 0) - Number(br.sortOrder ?? 0) ||
        String(ar.title ?? "").localeCompare(String(br.title ?? ""), "ar")
      );
    });

  return NextResponse.json({ reels });
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

  let body: CatalogReelInput;
  try {
    body = (await request.json()) as CatalogReelInput;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const sourceUrl = String(body.sourceUrl ?? "").trim();
  const audience = parseAudience(body.audience);
  if (!title) {
    return NextResponse.json({ error: "العنوان مطلوب." }, { status: 400 });
  }
  if (!audience) {
    return NextResponse.json({ error: "القناة غير صالحة." }, { status: 400 });
  }

  const parsed = parseVideoLink(sourceUrl);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const ref = db.collection("catalog_reels").doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    title,
    sourceUrl: parsed.data.sourceUrl,
    provider: parsed.data.provider,
    embedUrl: parsed.data.embedUrl,
    audience,
    sortOrder: Number(body.sortOrder ?? 0),
    likeCount: 0,
    isActive: body.isActive !== false,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.uid,
    updatedBy: auth.uid,
  });

  const saved = await ref.get();
  return NextResponse.json({
    ok: true,
    id: ref.id,
    reel: { id: ref.id, ...saved.data() },
  });
}
