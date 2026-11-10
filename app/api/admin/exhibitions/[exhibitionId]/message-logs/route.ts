import { NextResponse } from "next/server";
import {
  exhibitionErrorResponse,
  recordWhatsAppOpened,
} from "@/lib/server/exhibitions";
import { requireActiveAdmin } from "@/lib/server/verifyAdmin";
import {
  isValidExhibitionId,
  parseMessageLogBody,
} from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ exhibitionId: string }> },
) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;
  const { exhibitionId } = await params;
  if (!isValidExhibitionId(exhibitionId)) {
    return NextResponse.json({ error: "المعرض غير موجود." }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const parsed = parseMessageLogBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await recordWhatsAppOpened(ctx.db, exhibitionId, parsed.value, ctx.uid);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return exhibitionErrorResponse(err, "log whatsapp");
  }
}
