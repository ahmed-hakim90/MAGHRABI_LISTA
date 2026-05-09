"use client";

import { FileForm } from "@/components/admin/FileForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function NewFilePage() {
  const { user } = useAdminAuth();
  if (!user) return null;
  return <FileForm mode="create" uid={user.uid} />;
}
