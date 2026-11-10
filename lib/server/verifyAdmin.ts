import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

export async function verifyAdminUser(
  db: Firestore,
  uid: string,
): Promise<boolean> {
  const snap = await db.collection("adminUsers").doc(uid).get();
  return snap.exists && snap.data()?.isActive === true;
}

export async function getAdminUidFromRequest(
  request: Request,
): Promise<{ uid: string } | { error: Response }> {
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return {
      error: Response.json({ error: "غير مصرّح." }, { status: 401 }),
    };
  }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return {
      error: Response.json({ error: "رمز غير صالح." }, { status: 401 }),
    };
  }
}

/** Bearer token + active `adminUsers` row, with the Admin Firestore handle. */
export async function requireActiveAdmin(
  request: Request,
): Promise<{ uid: string; db: Firestore } | { error: Response }> {
  const auth = await getAdminUidFromRequest(request);
  if ("error" in auth) return auth;
  let db: Firestore;
  try {
    db = getAdminFirestore();
  } catch {
    return {
      error: Response.json(
        { error: "إعدادات Firebase Admin غير مكتملة." },
        { status: 503 },
      ),
    };
  }
  if (!(await verifyAdminUser(db, auth.uid))) {
    return { error: Response.json({ error: "غير مسموح." }, { status: 403 }) };
  }
  return { uid: auth.uid, db };
}
