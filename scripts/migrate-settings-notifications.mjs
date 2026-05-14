/**
 * One-time Firestore copy: settings -> file_settings, notifications -> file_notifications.
 *
 * Does NOT delete the old collections (safe to re-run; overwrites same doc ids in target).
 *
 * Usage:
 *   node scripts/migrate-settings-notifications.mjs
 *   npm run migrate:file-settings-notifications
 *
 * Credentials: same as sync-admin-claims — FIREBASE_SERVICE_ACCOUNT_JSON or
 * FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY in .env
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
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

async function migrateCollection(db, oldName, newName) {
  const snapshot = await db.collection(oldName).get();
  if (snapshot.empty) {
    console.log(`[migrate] ${oldName}: empty, skipping -> ${newName}`);
    return;
  }
  for (const doc of snapshot.docs) {
    await db.collection(newName).doc(doc.id).set(doc.data());
    console.log(`[migrate] ${oldName} -> ${newName}: copied ${doc.id}`);
  }
  console.log(`[migrate] Done: ${oldName} -> ${newName} (${snapshot.size} docs)`);
}

async function main() {
  const db = getFirestore(getApp());
  await migrateCollection(db, "settings", "file_settings");
  await migrateCollection(db, "notifications", "file_notifications");
  console.log("[migrate] All collections copied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
