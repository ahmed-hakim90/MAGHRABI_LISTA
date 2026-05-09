"use client";

import { FolderForm } from "@/components/admin/FolderForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function NewFolderPage() {
  const { user } = useAdminAuth();
  if (!user) return null;
  return <FolderForm mode="create" uid={user.uid} />;
}
