import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  exhibitionErrorResponse,
  registerForExhibition,
} from "@/lib/server/exhibitions";
import {
  clientIpFromRequest,
  createMemoryRateLimiter,
} from "@/lib/server/memoryRateLimit";
import { parseRegistrationBody } from "@/lib/utils/exhibitionValidation";

export const runtime = "nodejs";

const allowRegistration = createMemoryRateLimiter({
  windowMs: 10 * 60_000,
  max: 10,
});

export async function POST(request: Request) {
  if (!allowRegistration(clientIpFromRequest(request))) {
    return NextResponse.json(
      { error: "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const parsed = parseRegistrationBody(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  try {
    const result = await registerForExhibition(getAdminFirestore(), parsed.value);
    return NextResponse.json(result, {
      status: result.alreadyRegistered ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return exhibitionErrorResponse(err, "register");
  }
}
