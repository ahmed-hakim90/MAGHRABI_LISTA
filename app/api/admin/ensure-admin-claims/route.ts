import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

/**
 * For accounts that pass adminUsers but lack JWT custom claims (e.g. created
 * before claims existed). Call after sign-in with a fresh ID token; then
 * refresh the client token so Firestore rules see admin: true.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const idToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!idToken) {
    return NextResponse.json({ error: "رمز الدخول مفقود." }, { status: 401 });
  }

  const auth = getAdminAuth();
  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "رمز غير صالح." }, { status: 401 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection("adminUsers").doc(uid).get();
  const active =
    snap.exists && (snap.data() as { isActive?: boolean }).isActive === true;
  if (!active) {
    return NextResponse.json({ error: "غير مسموح." }, { status: 403 });
  }

  await auth.setCustomUserClaims(uid, { admin: true });
  return NextResponse.json({ ok: true });
}
