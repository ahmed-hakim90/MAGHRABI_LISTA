"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { assertFirebaseConfig, firebasePublicConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

export function getBrowserFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client must only be used in the browser.");
  }
  if (!app) {
    assertFirebaseConfig();
    app = getApps().length
      ? getApps()[0]!
      : initializeApp(firebasePublicConfig);
  }
  return app;
}

export function getClientAuth(): Auth {
  if (!auth) auth = getAuth(getBrowserFirebaseApp());
  return auth;
}

/**
 * Wait for Auth and ensure an ID token is available so Firestore requests use
 * current credentials (reduces permission-denied races after navigation / Fast Refresh).
 */
export async function syncAuthTokenForFirestore(): Promise<void> {
  const a = getClientAuth();
  await a.authStateReady();
  const u = a.currentUser;
  if (u) await u.getIdToken(true);
}

export function getClientFirestore(): Firestore {
  if (!db) {
    const firebaseApp = getBrowserFirebaseApp();
    const localCache =
      process.env.NODE_ENV === "development"
        ? memoryLocalCache()
        : persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          });
    try {
      db = initializeFirestore(firebaseApp, { localCache });
    } catch {
      // Fast Refresh remounts this module while Firestore is already started on the app.
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

export function getClientStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getBrowserFirebaseApp());
  return storage;
}
