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
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
        جاري التحميل…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <div className="flex flex-col lg:min-h-screen">
        <AdminSidebar />
        <div className="hidden p-4 lg:block">
          <button
            type="button"
            onClick={() => void signOut().then(() => router.replace("/admin/login"))}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-surface"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
      <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      <div className="border-t border-border bg-card p-4 lg:hidden">
        <button
          type="button"
          onClick={() => void signOut().then(() => router.replace("/admin/login"))}
          className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
