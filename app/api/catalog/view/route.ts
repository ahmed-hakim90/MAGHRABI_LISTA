import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type Body = { cardId?: string };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const buckets = new Map<string, { count: number; windowStart: number }>();

function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function allowRate(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (b.count >= MAX_PER_WINDOW) return false;
  b.count += 1;
  return true;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cardId = typeof body.cardId === "string" ? body.cardId.trim() : "";
  if (!cardId) {
    return NextResponse.json({ error: "cardId required" }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const db = getAdminFirestore();
  const ref = db.collection("fileCards").doc(cardId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const data = snap.data() as {
    isActive?: boolean;
    folderIsActive?: boolean;
  };
  if (!data.isActive || data.folderIsActive === false) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ref.update({
    viewCount: FieldValue.increment(1),
  });

  return NextResponse.json({ ok: true });
}
