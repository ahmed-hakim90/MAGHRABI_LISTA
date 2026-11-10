import { NextResponse } from "next/server";
import {
  exhibitionErrorResponse,
  setAttendanceStatus,
} from "@/lib/server/exhibitions";
import { requireActiveAdmin } from "@/lib/server/verifyAdmin";
import {
  isValidExhibitionId,
  parseAttendanceStatus,
} from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ exhibitionId: string; registrationId: string }> },
) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;
  const { exhibitionId, registrationId } = await params;
  if (!isValidExhibitionId(exhibitionId)) {
    return NextResponse.json({ error: "التسجيل غير موجود." }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }
  const body = raw as Record<string, unknown> | null;
  const status =
    body && typeof body === "object" && Object.keys(body).length === 1
      ? parseAttendanceStatus(body.attendanceStatus)
      : null;
  if (!status) {
    return NextResponse.json({ error: "حالة حضور غير صالحة." }, { status: 400 });
  }

  try {
    await setAttendanceStatus(ctx.db, exhibitionId, registrationId, status, ctx.uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return exhibitionErrorResponse(err, "set attendance");
  }
}
