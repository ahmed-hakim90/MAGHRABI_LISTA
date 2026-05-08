"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FileFolder } from "@/lib/types/models";
import {
  createFileFolder,
  updateFileFolder,
} from "@/lib/services/fileFolders";

type Props = {
  mode: "create" | "edit";
  uid: string;
  initial?: FileFolder | null;
};

export function FolderForm({ mode, uid, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Folder name is required.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await createFileFolder({
          name,
          description,
          order: Number(order) || 0,
          isActive,
          uid,
        });
      } else if (initial) {
        await updateFileFolder(initial.id, {
          name,
          description,
          order: Number(order) || 0,
          isActive,
          uid,
        });
      }
      router.push("/admin/folders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold text-foreground">
        {mode === "create" ? "New folder" : "Edit folder"}
      </h1>
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-foreground">Name</span>
        <input
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">Order</span>
        <input
          type="number"
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span className="text-sm text-foreground">
          Active (visible to public)
        </span>
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
