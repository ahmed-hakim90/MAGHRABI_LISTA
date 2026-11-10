import { NextResponse } from "next/server";
import {
  createExhibition,
  exhibitionErrorResponse,
  listExhibitionSummaries,
} from "@/lib/server/exhibitions";
import { requireActiveAdmin } from "@/lib/server/verifyAdmin";
import { parseNewExhibitionBody } from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;
  try {
    return NextResponse.json(
      { exhibitions: await listExhibitionSummaries(ctx.db) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return exhibitionErrorResponse(err, "list exhibitions");
  }
}

export async function POST(request: Request) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const parsed = parseNewExhibitionBody(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  try {
    await createExhibition(ctx.db, parsed.value, ctx.uid);
    return NextResponse.json({ ok: true, id: parsed.value.id }, { status: 201 });
  } catch (err) {
    return exhibitionErrorResponse(err, "create exhibition");
  }
}
