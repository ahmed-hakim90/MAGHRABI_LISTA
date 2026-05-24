import { NextResponse } from "next/server";
import { parseAudienceFromDoc } from "@/lib/constants/catalogChannels";
import { getActivePriceLists } from "@/lib/server/priceLists";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = parseAudienceFromDoc(searchParams.get("audience"));
  if (!audience) {
    return NextResponse.json({ error: "audience مطلوب." }, { status: 400 });
  }

  try {
    const lists = await getActivePriceLists(audience);
    return NextResponse.json({ lists });
  } catch {
    return NextResponse.json(
      { error: "تعذّر تحميل قوائم الأسعار." },
      { status: 500 },
    );
  }
}
