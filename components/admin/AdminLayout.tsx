"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/admin/login");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] text-[#6B6B6B]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F3] lg:flex-row">
      <div className="flex flex-col lg:min-h-screen">
        <AdminSidebar />
        <div className="hidden p-4 lg:block">
          <button
            type="button"
            onClick={() => void signOut().then(() => router.replace("/admin/login"))}
            className="w-full rounded-xl border border-[#E5E2DA] bg-white px-3 py-2 text-sm text-[#2F3437] transition hover:bg-[#F7F6F3]"
          >
            Logout
          </button>
        </div>
      </div>
      <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      <div className="border-t border-[#E5E2DA] bg-white p-4 lg:hidden">
        <button
          type="button"
          onClick={() => void signOut().then(() => router.replace("/admin/login"))}
          className="w-full rounded-xl border border-[#E5E2DA] px-3 py-2 text-sm text-[#2F3437]"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
