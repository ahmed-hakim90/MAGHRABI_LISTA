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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F6F3] px-4 text-center">
        <p className="text-sm text-[#6B6B6B]">Page not found.</p>
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
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.replace("/admin/login?registered=1");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F6F3] px-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-[#E5E2DA] bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-[#2F3437]">Admin registration</h1>
        <p className="text-xs text-[#6B6B6B]">
          This page is only reachable with the private setup link. Do not share it.
        </p>
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        <label className="block">
          <span className="text-sm text-[#2F3437]">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-[#2F3437]">Password</span>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="mt-1 w-full rounded-xl border border-[#E5E2DA] px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#2F3437] py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create admin account"}
        </button>
        <Link
          href="/"
          className="block text-center text-xs text-[#6B6B6B] hover:underline"
        >
          ← Public library
        </Link>
      </form>
    </div>
  );
}

export default function AdminJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] text-[#6B6B6B]">
          Loading…
        </div>
      }
    >
      <JoinAdminForm />
    </Suspense>
  );
}
