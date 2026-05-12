import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";

function parseServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const j = JSON.parse(raw) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return {
      projectId: j.project_id,
      clientEmail: j.client_email,
      privateKey: j.private_key.replace(/\\n/g, "\n"),
    };
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  privateKey = privateKey.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY",
    );
  }
  return { projectId, clientEmail, privateKey };
}

let didWarnProjectMismatch = false;

/** Warn once if client env and Admin SDK target different Firebase projects (common cause of permission-denied). */
function warnIfFirebaseProjectMismatch(adminProjectId: string): void {
  if (didWarnProjectMismatch) return;
  didWarnProjectMismatch = true;
  const pub = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!pub || pub === adminProjectId) return;
  console.warn(
    `[firebase] NEXT_PUBLIC_FIREBASE_PROJECT_ID (${pub}) differs from Admin SDK project (${adminProjectId}). Use the same project for web config, rules deploy, and service account.`,
  );
}

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const { projectId, clientEmail, privateKey } = parseServiceAccount();
  warnIfFirebaseProjectMismatch(projectId);
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}

/** Default bucket matches client uploads (see NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET). */
export function getAdminBucket() {
  const name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const storage = getStorage(getAdminApp());
  return name ? storage.bucket(name) : storage.bucket();
}
