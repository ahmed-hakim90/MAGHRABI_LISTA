/**
 * One-time backfill: copies `adminUsers/{uid}.isActive` -> Auth custom claim `admin: true|false`.
 *
 * Usage:
 *   node scripts/sync-admin-claims.mjs
 *
 * Reads service account from FIREBASE_SERVICE_ACCOUNT_JSON in .env (or split FIREBASE_ADMIN_*).
 * Safe to re-run; idempotent. Required after migrating Storage/Firestore rules to use
 * `request.auth.token.admin == true` (instead of cross-service `firestore.exists/get`).
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const j = JSON.parse(raw);
    return {
      projectId: j.project_id,
      clientEmail: j.client_email,
      privateKey: String(j.private_key).replace(/\\n/g, "\n"),
    };
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(
    /\\n/g,
    "\n",
  );
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY in .env",
    );
  }
  return { projectId, clientEmail, privateKey };
}

function getApp() {
  if (getApps().length) return getApps()[0];
  const { projectId, clientEmail, privateKey } = parseServiceAccount();
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const snap = await db.collection("adminUsers").get();
  if (snap.empty) {
    console.log("[sync-admin-claims] No documents in adminUsers. Nothing to do.");
    return;
  }

  let updated = 0;
  let unchanged = 0;
  let missing = 0;
  let revoked = 0;

  for (const doc of snap.docs) {
    const uid = doc.id;
    const data = doc.data() ?? {};
    const shouldBeAdmin = data.isActive === true;
    let user;
    try {
      user = await auth.getUser(uid);
    } catch (e) {
      missing += 1;
      console.warn(
        `[sync-admin-claims] adminUsers/${uid} has no matching Auth user. Skipped.`,
      );
      continue;
    }

    const currentlyAdmin = user.customClaims?.admin === true;

    if (shouldBeAdmin && !currentlyAdmin) {
      await auth.setCustomUserClaims(uid, {
        ...(user.customClaims ?? {}),
        admin: true,
      });
      updated += 1;
      console.log(`[sync-admin-claims] +admin -> ${user.email ?? uid}`);
    } else if (!shouldBeAdmin && currentlyAdmin) {
      const next = { ...(user.customClaims ?? {}) };
      delete next.admin;
      await auth.setCustomUserClaims(uid, next);
      revoked += 1;
      console.log(`[sync-admin-claims] -admin -> ${user.email ?? uid}`);
    } else {
      unchanged += 1;
    }
  }

  console.log(
    `[sync-admin-claims] Done. updated=${updated} revoked=${revoked} unchanged=${unchanged} missing=${missing}`,
  );
  console.log(
    "[sync-admin-claims] Affected users must sign out / sign in OR call getIdToken(true) to pick up the new claim.",
  );
}

main().catch((e) => {
  console.error("[sync-admin-claims] Failed:", e);
  process.exit(1);
});
