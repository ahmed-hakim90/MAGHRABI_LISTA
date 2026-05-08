"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { useCallback, useLayoutEffect, useState } from "react";
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

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      if (!("Notification" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "granted") setStatus("granted");
      else if (Notification.permission === "denied") setStatus("denied");
      else setStatus("idle");
    });
  }, []);

  const registerAndSaveToken = useCallback(async () => {
    setMessage(null);
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      setMessage("المتصفح لا يدعم التحديثات في الخلفية.");
      return;
    }
    if (!firebaseVapidKey) {
      setStatus("error");
      setMessage("إعدادات الإشعارات غير مكتملة على الخادم.");
      return;
    }
    setStatus("requesting");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const messaging = await getClientMessaging();
      if (!messaging) {
        setStatus("unsupported");
        setMessage("هذا المتصفح لا يدعم إشعارات Firebase.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("لم يتم السماح بالإشعارات.");
        return;
      }
      const token = await getToken(messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: reg,
      });
      if (!token) {
        setStatus("error");
        setMessage("تعذر الحصول على رمز الجهاز.");
        return;
      }
      const db = getClientFirestore();
      const id = await tokenDocId(token);
      const ref = doc(db, "fcmTokens", id);
      // Single merge write: avoids updateDoc on missing docs (fragile error codes) and matches
      // firestore.rules allow create, update on fcmTokens for anonymous clients.
      await setDoc(
        ref,
        {
          token,
          userAgent: navigator.userAgent,
          isActive: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setStatus("granted");
      setMessage("تم التفعيل. سنرسل لك تنبيهات عند إضافة ملفات جديدة.");
    } catch (e) {
      setStatus("error");
      setMessage(
        e instanceof Error ? e.message : "تعذر تفعيل الإشعارات.",
      );
    }
  }, []);

  return { status, message, registerAndSaveToken };
}
