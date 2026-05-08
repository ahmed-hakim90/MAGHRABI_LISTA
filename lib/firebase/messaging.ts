"use client";

import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import { getBrowserFirebaseApp } from "./client";

let messaging: Messaging | undefined;

export async function getClientMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  const ok = await isSupported().catch(() => false);
  if (!ok) return null;
  const app = getBrowserFirebaseApp();
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}
