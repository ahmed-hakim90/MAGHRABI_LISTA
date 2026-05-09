"use client";

import Link from "next/link";
import { FileTable } from "@/components/admin/FileTable";

export default function AdminFilesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground">الملفات</h1>
        <Link
          href="/admin/files/new"
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          ملف جديد
        </Link>
      </div>
      <FileTable />
    </div>
  );
}
