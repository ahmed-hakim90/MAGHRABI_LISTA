"use client";

import Link from "next/link";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminHomePage() {
  const { user } = useAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#2F3437]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          Signed in as {user?.email ?? "—"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/files"
          className="rounded-2xl border border-[#E5E2DA] bg-white p-4 text-sm font-medium text-[#2F3437] shadow-sm transition hover:border-[#2F3437]/20"
        >
          Manage files →
        </Link>
        <Link
          href="/admin/notifications"
          className="rounded-2xl border border-[#E5E2DA] bg-white p-4 text-sm font-medium text-[#2F3437] shadow-sm transition hover:border-[#2F3437]/20"
        >
          Send notification →
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-2xl border border-[#E5E2DA] bg-white p-4 text-sm font-medium text-[#2F3437] shadow-sm transition hover:border-[#2F3437]/20"
        >
          Site settings →
        </Link>
      </div>
    </div>
  );
}
