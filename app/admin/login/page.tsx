"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signInAdmin } from "@/lib/firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await signInAdmin(email, password);
      const db = getClientFirestore();
      const snap = await getDoc(doc(db, "adminUsers", user.uid));
      const ok =
        snap.exists() &&
        (snap.data() as { isActive?: boolean }).isActive === true;
      if (!ok) {
        setError("ليس لديك صلاحية كمسؤول نشط.");
        const { signOutAdmin } = await import("@/lib/firebase/auth");
        await signOutAdmin();
        setBusy(false);
        return;
      }

      const idToken = await user.getIdToken();
      try {
        const res = await fetch("/api/admin/ensure-admin-claims", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.status === 403) {
          setError("ليس لديك صلاحية كمسؤول نشط.");
          const { signOutAdmin } = await import("@/lib/firebase/auth");
          await signOutAdmin();
          setBusy(false);
          return;
        }
      } catch {
        /* إن فشل الطلب نُكمل ونتحقق من الـ claims بعد تحديث الرمز */
      }

      await user.getIdToken(true);
      const tokenResult = await user.getIdTokenResult(true);
      if (tokenResult.claims.admin !== true) {
        setError(
          "تعذّر تفعيل صلاحية المسؤول في الرمز. تحقق من إعداد الخادم (Firebase Admin) وقواعد Firestore المنشورة.",
        );
        const { signOutAdmin } = await import("@/lib/firebase/auth");
        await signOutAdmin();
        setBusy(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("البريد أو كلمة المرور غير صحيحة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-foreground">تسجيل دخول المسؤول</h1>
        {justRegistered ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            تم إنشاء الحساب. سجّل الدخول ببياناتك الجديدة.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <label className="block">
          <span className="text-sm text-foreground">البريد الإلكتروني</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-foreground">كلمة المرور</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "جاري تسجيل الدخول…" : "تسجيل الدخول"}
        </button>
        <Link href="/" className="block text-center text-xs text-muted hover:underline">
          ← المكتبة العامة
        </Link>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
          جاري التحميل…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
