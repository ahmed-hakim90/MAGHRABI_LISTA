import { NextResponse } from "next/server";
import {
  describeIndexFailure,
  exhibitionErrorResponse,
  getExhibition,
  getExhibitionStats,
  updateExhibition,
} from "@/lib/server/exhibitions";
import { requireActiveAdmin } from "@/lib/server/verifyAdmin";
import {
  isValidExhibitionId,
  parseExhibitionPatch,
} from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ exhibitionId: string }> };

const NOT_FOUND = { error: "المعرض غير موجود." };

export async function GET(request: Request, { params }: Ctx) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;
  const { exhibitionId } = await params;
  if (!isValidExhibitionId(exhibitionId)) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }

  try {
    const exhibition = await getExhibition(ctx.db, exhibitionId);
    if (!exhibition) return NextResponse.json(NOT_FOUND, { status: 404 });
    // Totals are optional: editing the schedule must work even if they fail.
    let stats = null;
    let statsError: string | null = null;
    try {
      stats = await getExhibitionStats(ctx.db, exhibitionId);
    } catch (err) {
      console.error("[exhibitions] stats unavailable", {
        code: (err as { code?: unknown })?.code,
      });
      statsError = describeIndexFailure(err) ?? "تعذّر حساب الإحصائيات الآن.";
    }
    return NextResponse.json(
      { exhibition, stats, statsError },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return exhibitionErrorResponse(err, "load exhibition");
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;
  const { exhibitionId } = await params;
  if (!isValidExhibitionId(exhibitionId)) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const parsed = parseExhibitionPatch(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  try {
    const exhibition = await updateExhibition(
      ctx.db,
      exhibitionId,
      parsed.value,
      ctx.uid,
    );
    return NextResponse.json({ exhibition });
  } catch (err) {
    return exhibitionErrorResponse(err, "update exhibition");
  }
}
