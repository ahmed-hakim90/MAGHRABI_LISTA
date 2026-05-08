"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { useCallback, useState } from "react";
import { firebaseVapidKey } from "@/lib/firebase/config";
import { getClientFirestore } from "@/lib/firebase/client";
import { getClientMessaging } from "@/lib/firebase/messaging";

async function tokenDocId(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 40);
}

export function useFcmToken() {
  const [status, setStatus] = useState<
    "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const registerAndSaveToken = useCallback(async () => {
    setMessage(null);
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      setMessage("Service workers not supported");
      return;
    }
    if (!firebaseVapidKey) {
      setStatus("error");
      setMessage("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
      return;
    }
    setStatus("requesting");
    try {
      const reg = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );
      await navigator.serviceWorker.ready;
      const messaging = await getClientMessaging();
      if (!messaging) {
        setStatus("unsupported");
        setMessage("Firebase Messaging not supported in this browser");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Notification permission denied");
        return;
      }
      const token = await getToken(messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: reg,
      });
      if (!token) {
        setStatus("error");
        setMessage("No FCM token returned");
        return;
      }
      const db = getClientFirestore();
      const id = await tokenDocId(token);
      const ref = doc(db, "fcmTokens", id);
      const existing = await getDoc(ref);
      const base = {
        token,
        userAgent: navigator.userAgent,
        isActive: true,
        updatedAt: serverTimestamp(),
      };
      await setDoc(
        ref,
        existing.exists()
          ? base
          : { ...base, createdAt: serverTimestamp() },
        { merge: true },
      );
      setStatus("granted");
      setMessage("You will receive updates for new files.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Failed to enable notifications");
    }
  }, []);

  return { status, message, registerAndSaveToken };
}
