import { NextResponse } from "next/server";
import {
  AUDIENCE_TO_CHANNEL,
  normalizeAudienceFromDoc,
} from "@/lib/constants/catalogChannels";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Redirect legacy `/file/:id/pdf` to canonical `/{channel}/file/:id/pdf`. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params;
  const db = getAdminFirestore();
  const snap = await db.collection("fileCards").doc(cardId).get();
  if (!snap.exists) {
    return new Response("Not found", { status: 404 });
  }
  const d = snap.data() as Record<string, unknown>;
  if (!d.isActive || d.folderIsActive === false) {
    return new Response("Not found", { status: 404 });
  }
  const aud = normalizeAudienceFromDoc(d.audience);
  const ch = AUDIENCE_TO_CHANNEL[aud];
  const url = new URL(req.url);
  const target = new URL(`/${ch}/file/${cardId}/pdf${url.search}`, url.origin);
  return NextResponse.redirect(target, 307);
}
