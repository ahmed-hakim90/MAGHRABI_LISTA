"use client";

import Link from "next/link";
import { FolderTable } from "@/components/admin/FolderTable";

export default function AdminFoldersPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">المجلدات</h1>
          <p className="mt-1 text-sm text-muted">
            تجميع الملفات في مجلدات بأسماء. تعطيل مجلد يخفيه ويخفي ملفاته عن
            الزوار.
          </p>
        </div>
        <Link
          href="/admin/folders/new"
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          مجلد جديد
        </Link>
      </div>
      <FolderTable />
    </div>
  );
}
