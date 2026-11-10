import { NextResponse } from "next/server";
import {
  exhibitionErrorResponse,
  listRegistrationsPage,
} from "@/lib/server/exhibitions";
import { requireActiveAdmin } from "@/lib/server/verifyAdmin";
import {
  isValidExhibitionId,
  parseAttendanceStatus,
} from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ exhibitionId: string }> },
) {
  const ctx = await requireActiveAdmin(request);
  if ("error" in ctx) return ctx.error;
  const { exhibitionId } = await params;
  if (!isValidExhibitionId(exhibitionId)) {
    return NextResponse.json({ error: "المعرض غير موجود." }, { status: 404 });
  }

  const sp = new URL(request.url).searchParams;
  const rawStatus = sp.get("status");
  const status = rawStatus ? parseAttendanceStatus(rawStatus) : null;
  if (rawStatus && !status) {
    return NextResponse.json({ error: "فلتر غير صالح." }, { status: 400 });
  }
  const rawContacted = sp.get("contacted");
  if (rawContacted && rawContacted !== "yes" && rawContacted !== "no") {
    return NextResponse.json({ error: "فلتر غير صالح." }, { status: 400 });
  }

  try {
    const page = await listRegistrationsPage(ctx.db, exhibitionId, {
      status,
      contacted: rawContacted ? rawContacted === "yes" : null,
      search: (sp.get("q") ?? "").slice(0, 40),
      cursor: sp.get("cursor") ?? "",
    });
    return NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return exhibitionErrorResponse(err, "list registrations");
  }
}
