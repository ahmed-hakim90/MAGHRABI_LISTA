"use client";

import Link from "next/link";
import { useFcmToken } from "@/hooks/useFcmToken";

export function PublicFooter() {
  const { status, message, registerAndSaveToken } = useFcmToken();

  return (
    <footer className="mt-auto border-t border-[#E5E2DA] bg-[#F7F6F3]/80 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="space-y-2">
          <p className="text-sm text-[#6B6B6B]">Stay informed about new files.</p>
          <button
            type="button"
            onClick={() => void registerAndSaveToken()}
            disabled={status === "requesting" || status === "granted"}
            className="rounded-xl border border-[#E5E2DA] bg-white px-4 py-2 text-sm font-medium text-[#2F3437] transition hover:bg-[#F7F6F3] disabled:opacity-60"
          >
            {status === "granted"
              ? "Notifications enabled"
              : status === "requesting"
                ? "Enabling…"
                : "Enable notifications"}
          </button>
          {message ? (
            <p className="max-w-sm text-xs text-[#6B6B6B]">{message}</p>
          ) : null}
        </div>
        <Link
          href="/admin/login"
          className="text-[11px] text-[#6B6B6B]/70 underline-offset-2 hover:text-[#2F3437] hover:underline"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
