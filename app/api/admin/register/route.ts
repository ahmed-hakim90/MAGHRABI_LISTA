import { timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

function isValidSetupToken(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type Body = {
  setupToken?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const expected = process.env.ADMIN_SETUP_TOKEN?.trim();
  if (!expected || expected.length < 24) {
    return NextResponse.json(
      { error: "Admin registration is not configured." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const setupToken = typeof body.setupToken === "string" ? body.setupToken : "";
  if (!isValidSetupToken(setupToken, expected)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const auth = getAdminAuth();
  const db = getAdminFirestore();

  try {
    const user = await auth.createUser({ email, password });
    await auth.setCustomUserClaims(user.uid, { admin: true });
    await db.collection("adminUsers").doc(user.uid).set({
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not create admin." }, { status: 500 });
  }
}
