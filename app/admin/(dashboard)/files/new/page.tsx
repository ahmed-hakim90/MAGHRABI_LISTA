"use client";

import { FileForm } from "@/components/admin/FileForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function NewFilePage() {
  const { user } = useAdminAuth();
  if (!user) return null;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">New file</h1>
      <FileForm mode="create" uid={user.uid} />
    </div>
  );
}
