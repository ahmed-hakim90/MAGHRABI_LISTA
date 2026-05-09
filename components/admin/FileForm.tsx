"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FileCard, FileFolder } from "@/lib/types/models";
import {
  createFileCard,
  updateFileCardMeta,
} from "@/lib/services/fileCards";
import { listAllFileFoldersAdmin } from "@/lib/services/fileFolders";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UploadField } from "./UploadField";

type Props = {
  mode: "create" | "edit";
  uid: string;
  initial?: FileCard | null;
};

export function FileForm({ mode, uid, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [productCountStr, setProductCountStr] = useState(
    initial?.productCount != null ? String(initial.productCount) : "",
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [folderId, setFolderId] = useState(initial?.folderId ?? "");
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    void listAllFileFoldersAdmin().then(setFolders);
  }, []);

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function resolveFolderFields(): {
    folderId: string;
    folderName: string;
    folderIsActive: boolean;
  } {
    if (!folderId) {
      return { folderId: "", folderName: "", folderIsActive: true };
    }
    const f = folders.find((x) => x.id === folderId);
    return {
      folderId,
      folderName: f?.name ?? "",
      folderIsActive: f?.isActive ?? true,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const productCount = (() => {
      const t = productCountStr.trim();
      if (!t) return null;
      const n = Number(t);
      if (!Number.isFinite(n) || n < 0) return undefined;
      return Math.floor(n);
    })();
    if (productCount === undefined) {
      setError("Product count must be a non-negative number or empty.");
      return;
    }
    setSaving(true);
    setUploadProgress(mode === "create" ? 0 : null);
    try {
      const folderFields = resolveFolderFields();
      if (mode === "create") {
        if (!pdf) {
          setError("PDF is required.");
          setSaving(false);
          setUploadProgress(null);
          return;
        }
        await createFileCard(
          {
            title,
            description,
            category,
            tags,
            order: Number(order) || 0,
            isActive,
            productCount,
            ...folderFields,
            pdfFile: pdf,
            thumbnailFile: thumb ?? undefined,
            uid,
          },
          { onProgress: (p) => setUploadProgress(p) },
        );
        setUploadProgress(null);
        router.push("/admin/files");
        router.refresh();
        return;
      }
      if (!initial) return;
      await updateFileCardMeta(initial.id, {
        title,
        description,
        category,
        tags,
        order: Number(order) || 0,
        isActive,
        productCount,
        ...folderFields,
        uid,
      });
      router.push("/admin/files");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold text-foreground">
        {mode === "create" ? "New file" : "Edit file"}
      </h1>
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {uploadProgress !== null ? (
        <ProgressBar
          label="جاري رفع الملفات…"
          value={uploadProgress}
          className="pt-1"
        />
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-foreground">Title</span>
        <input
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          required
          rows={3}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">Category</span>
        <input
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          Product count (optional)
        </span>
        <input
          type="number"
          min={0}
          step={1}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={productCountStr}
          onChange={(e) => setProductCountStr(e.target.value)}
          placeholder="e.g. number of SKUs"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">Folder</span>
        <select
          className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-[15px]"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">— No folder —</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {f.isActive ? "" : " (inactive)"}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          Tags (comma-separated)
        </span>
        <input
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-[15px]"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
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
        <span className="text-sm text-foreground">Active (visible to public)</span>
      </label>
      {mode === "create" ? (
        <>
          <UploadField
            label="PDF"
            accept="application/pdf"
            file={pdf}
            onFile={setPdf}
            required
          />
          <UploadField
            label="Thumbnail (optional — PDF icon is used if empty)"
            accept="image/*"
            file={thumb}
            onFile={setThumb}
          />
        </>
      ) : null}
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
