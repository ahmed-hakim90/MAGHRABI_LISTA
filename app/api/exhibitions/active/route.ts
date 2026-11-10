import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  exhibitionErrorResponse,
  getActiveExhibition,
  PUBLIC_EXHIBITION_CACHE_HEADERS,
  toPublicExhibition,
} from "@/lib/server/exhibitions";

export const runtime = "nodejs";

export async function GET() {
  try {
    const exhibition = await getActiveExhibition(getAdminFirestore());
    return NextResponse.json(
      { exhibition: exhibition ? toPublicExhibition(exhibition) : null },
      { headers: PUBLIC_EXHIBITION_CACHE_HEADERS },
    );
  } catch (err) {
    return exhibitionErrorResponse(err, "load active exhibition");
  }
}
