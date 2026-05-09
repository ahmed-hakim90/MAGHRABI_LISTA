"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function JoinAdminForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
        <p className="text-sm text-muted">الصفحة غير موجودة.</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupToken: token, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ ما.");
        return;
      }
      router.replace("/admin/login?registered=1");
      router.refresh();
    } catch {
      setError("خطأ في الشبكة.");
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
        <h1 className="text-lg font-semibold text-foreground">تسجيل مسؤول</h1>
        <p className="text-xs text-muted">
          هذه الصفحة متاحة فقط عبر رابط الإعداد الخاص. لا تشاركه.
        </p>
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
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
            autoComplete="new-password"
            minLength={8}
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
          {busy ? "جاري إنشاء الحساب…" : "إنشاء حساب مسؤول"}
        </button>
        <Link
          href="/"
          className="block text-center text-xs text-muted hover:underline"
        >
          ← المكتبة العامة
        </Link>
      </form>
    </div>
  );
}

export default function AdminJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
          جاري التحميل…
        </div>
      }
    >
      <JoinAdminForm />
    </Suspense>
  );
}
