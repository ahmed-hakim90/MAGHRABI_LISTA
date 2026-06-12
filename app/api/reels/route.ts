import { NextResponse } from "next/server";
import type { CatalogAudience } from "@/lib/constants/catalogChannels";
import { getActiveReelsForAudience } from "@/lib/server/reels";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("audience")?.trim() ?? "";
  if (raw !== "wholesale" && raw !== "retail" && raw !== "no_prices") {
    return NextResponse.json({ error: "قناة غير صالحة." }, { status: 400 });
  }

  try {
    const reels = await getActiveReelsForAudience(raw as CatalogAudience);
    return NextResponse.json(
      { reels },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=900, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "تعذّر تحميل الفيديوهات." },
      { status: 503 },
    );
  }
}
