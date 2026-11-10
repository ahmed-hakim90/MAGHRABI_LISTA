import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  exhibitionErrorResponse,
  getExhibition,
  PUBLIC_EXHIBITION_CACHE_HEADERS,
} from "@/lib/server/exhibitions";
import {
  buildExhibitionIcs,
  resolveExhibitionInstant,
} from "@/lib/utils/exhibitionSchedule";
import { isValidExhibitionId } from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

/**
 * Public calendar invitation for an announced exhibition. Contains only the
 * event itself — never customer data. `?download=1` forces a file download.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ exhibitionId: string }> },
) {
  const { exhibitionId } = await ctx.params;
  const notFound = Response.json(
    { error: "لم يتم الإعلان عن موعد المعرض بعد." },
    { status: 404 },
  );
  if (!isValidExhibitionId(exhibitionId)) return notFound;

  try {
    const exhibition = await getExhibition(getAdminFirestore(), exhibitionId);
    if (!exhibition?.isActive) return notFound;
    const instant = resolveExhibitionInstant(exhibition);
    if (!instant) return notFound;

    const ics = buildExhibitionIcs({ ...exhibition, ...instant });
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${exhibition.id}.ics"`,
        ...PUBLIC_EXHIBITION_CACHE_HEADERS,
      },
    });
  } catch (err) {
    return exhibitionErrorResponse(err, "calendar");
  }
}
