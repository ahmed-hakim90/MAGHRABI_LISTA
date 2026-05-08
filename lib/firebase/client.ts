"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
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

export function getClientFirestore(): Firestore {
  if (!db) {
    db = initializeFirestore(getBrowserFirebaseApp(), {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return db;
}

export function getClientStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getBrowserFirebaseApp());
  return storage;
}
