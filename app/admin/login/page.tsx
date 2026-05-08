"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInAdmin } from "@/lib/firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";

export default function AdminLoginPage() {
  const router = useRouter();
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
        setError("You are not authorized as an active admin.");
        const { signOutAdmin } = await import("@/lib/firebase/auth");
        await signOutAdmin();
        setBusy(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Invalid email or password.");
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
        <h1 className="text-lg font-semibold text-[#2F3437]">Admin sign in</h1>
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
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
            autoComplete="current-password"
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
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link href="/" className="block text-center text-xs text-[#6B6B6B] hover:underline">
          ← Public library
        </Link>
      </form>
    </div>
  );
}
