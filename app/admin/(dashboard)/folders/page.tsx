"use client";

import Link from "next/link";
import { FolderTable } from "@/components/admin/FolderTable";

export default function AdminFoldersPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#2F3437]">Folders</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">
            Group files into named folders. Deactivating a folder hides it and
            its files from the public.
          </p>
        </div>
        <Link
          href="/admin/folders/new"
          className="inline-flex rounded-xl bg-[#2F3437] px-4 py-2 text-sm font-medium text-white"
        >
          New folder
        </Link>
      </div>
      <FolderTable />
    </div>
  );
}
