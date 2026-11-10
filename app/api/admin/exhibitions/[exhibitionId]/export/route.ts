import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import {
  ATTENDANCE_STATUS_LABELS_AR,
  EXHIBITION_TIME_ZONE,
  MESSAGE_KIND_LABELS_AR,
} from "@/lib/constants/exhibition";
import {
  exhibitionErrorResponse,
  getExhibition,
  listAllRegistrations,
} from "@/lib/server/exhibitions";
import { requireActiveAdmin } from "@/lib/server/verifyAdmin";
import { isValidExhibitionId } from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

/** Prevents spreadsheet formula injection from customer-typed names. */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cairoDateTime(ms: number | null): string {
  if (!ms) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: EXHIBITION_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

/** Local Egyptian format so the sheet matches how the team dials numbers. */
function localPhone(waDigits: string): string {
  return waDigits.startsWith("20") ? `0${waDigits.slice(2)}` : waDigits;
}

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

  try {
    const exhibition = await getExhibition(ctx.db, exhibitionId);
    if (!exhibition) {
      return NextResponse.json({ error: "المعرض غير موجود." }, { status: 404 });
    }
    const rows = (await listAllRegistrations(ctx.db, exhibitionId)).map((r) => ({
      "رقم التسجيل": r.registrationNumber,
      "اسم العميل": safeCell(r.name),
      "رقم الموبايل": localPhone(r.phone),
      "عدد الحضور": r.attendeeCount,
      "حالة الحضور": ATTENDANCE_STATUS_LABELS_AR[r.attendanceStatus],
      "مرات التواصل": r.contactCount,
      "آخر رسالة": r.lastMessageKind ? MESSAGE_KIND_LABELS_AR[r.lastMessageKind] : "",
      "آخر تواصل": cairoDateTime(r.lastContactedAtMs),
      "تاريخ التسجيل": cairoDateTime(r.createdAtMs),
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [12, 28, 16, 10, 16, 12, 10, 18, 18].map((wch) => ({ wch }));
    const book = XLSX.utils.book_new();
    book.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(book, sheet, "المسجلون");
    const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;

    console.info("[exhibitions] export", {
      exhibitionId,
      rows: rows.length,
      by: ctx.uid,
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exhibitionId}-registrations.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return exhibitionErrorResponse(err, "export");
  }
}
