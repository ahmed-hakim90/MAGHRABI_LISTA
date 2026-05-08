"use client";

import { FolderForm } from "@/components/admin/FolderForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function NewFolderPage() {
  const { user } = useAdminAuth();
  if (!user) return null;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[#2F3437]">New folder</h1>
      <FolderForm mode="create" uid={user.uid} />
    </div>
  );
}
